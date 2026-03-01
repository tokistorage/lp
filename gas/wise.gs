/**
 * Wise Webhook + API (wise.gs)
 */

function isOrderPayment(ref) {
  return /laminate|quartz|PearlSoap-Ambassador/i.test(ref);
}

function processTokiCode(ss, tokiMatch, ref, amt, cur) {
  var code = tokiMatch[0];

  // 注文コード（laminate/quartz含む）
  if (isOrderPayment(ref)) {
    registerOrderCode(ss, code, amt, cur);
    return;
  }

  // 特集権コード
  if (/Tokushu/i.test(ref)) {
    var count = Math.floor(amt / (PRICES_TOKUSHU[cur] || PRICES_TOKUSHU['JPY']));
    if (count < 1) count = 1;
    registerCreditCode(ss, code, count, 'tokushu');
    return;
  }

  // サービス（アドバイザー / Workaway / オフグリッド）
  if (/TimelessAdvisor|Workaway-Consulting|OffGrid-Consulting/i.test(ref)) {
    recordAdvisorPayment(ss, code, amt, cur, ref);
    return;
  }

  // マルチQRクレジットコード
  var count = Math.floor(amt / (PRICES.credit[cur] || PRICES.credit['JPY']));
  if (count < 1) count = 1;
  registerCreditCode(ss, code, count, 'multiQR');
}

function handleWiseWebhook(ss, data, raw) {
  var logSheet = getOrCreateSheet(ss, 'Wise Webhook', [
    '日時', 'event_type', 'amount', 'currency', 'reference', 'raw'
  ]);
  logSheet.insertRowAfter(1);
  logSheet.getRange(2, 1, 1, 6).setValues([[
    new Date(), data.event_type || '',
    (data.data && data.data.amount) || '',
    (data.data && data.data.currency) || '',
    '', raw.substring(0, 1000)
  ]]);

  // transfers#state-change
  if (data.event_type === 'transfers#state-change' && data.data) {
    var d = data.data;
    if (d.current_state === 'outgoing_payment_sent' || d.current_state === 'funds_converted') {
      var transferId = d.resource && d.resource.id;
      if (transferId) {
        var transfer = fetchWiseTransfer(transferId);
        if (transfer) {
          var ref = (transfer.details && transfer.details.reference) || transfer.reference || '';
          logSheet.getRange(2, 5).setValue(ref);
          var tokiMatch = ref.match(/TOKI-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/);
          if (tokiMatch) {
            processTokiCode(ss, tokiMatch, ref,
              transfer.targetValue || transfer.sourceValue,
              transfer.targetCurrency || transfer.sourceCurrency);
          }
        }
      }
    }
  }

  // balances#credit
  if (data.event_type === 'balances#credit' && data.data) {
    var d = data.data;
    if (d.resource && d.resource.id === 0 && d.resource.profile_id === 0) {
      return jsonResponse({ success: true, note: 'test event ignored' });
    }
    var profileId = d.resource && d.resource.profile_id;
    var balanceId = d.resource && d.resource.id;
    if (profileId && balanceId) {
      var ref = fetchRecentCreditReference(profileId, balanceId, d.currency, d.amount, d.occurred_at) || '';
      logSheet.getRange(2, 5).setValue(ref || '(API照会済み・該当なし)');
      if (ref) {
        var tokiMatch = ref.match(/TOKI-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/);
        if (tokiMatch) {
          processTokiCode(ss, tokiMatch, ref, d.amount, d.currency);
        } else {
          notifyPayment(d.amount, d.currency, ref);
        }
      } else {
        notifyPayment(d.amount, d.currency, '');
      }
    }
  }

  return jsonResponse({ success: true });
}

function fetchWiseTransfer(transferId) {
  if (!WISE_API_TOKEN) return null;
  try {
    var res = UrlFetchApp.fetch('https://api.wise.com/v1/transfers/' + transferId, {
      headers: { 'Authorization': 'Bearer ' + WISE_API_TOKEN },
      muteHttpExceptions: true
    });
    if (res.getResponseCode() !== 200) return null;
    return JSON.parse(res.getContentText());
  } catch (e) { return null; }
}

function fetchRecentCreditReference(profileId, balanceId, currency, amount, occurredAt) {
  if (!WISE_API_TOKEN) return null;
  try {
    var dt = new Date(occurredAt);
    var start = new Date(dt.getTime() - 3600000).toISOString();
    var end = new Date(dt.getTime() + 3600000).toISOString();
    var url = 'https://api.wise.com/v4/profiles/' + profileId
      + '/balances/' + balanceId + '/statements'
      + '?intervalStart=' + start + '&intervalEnd=' + end
      + '&currency=' + currency + '&type=COMPACT';
    var res = UrlFetchApp.fetch(url, {
      headers: { 'Authorization': 'Bearer ' + WISE_API_TOKEN },
      muteHttpExceptions: true
    });
    if (res.getResponseCode() !== 200) return null;
    var result = JSON.parse(res.getContentText());
    var transactions = result.transactions || [];
    for (var i = 0; i < transactions.length; i++) {
      var t = transactions[i];
      if (t.amount && t.amount.value === amount && t.type === 'CREDIT') {
        var details = t.details || {};
        return details.description || details.reference || '';
      }
    }
    return null;
  } catch (e) { return null; }
}

function recordAdvisorPayment(ss, code, amount, currency, ref) {
  var sheet = getOrCreateSheet(ss, 'アドバイザー', [
    '日時', 'コード', '金額', '通貨', 'タイプ', 'ステータス', '開始日', '終了日'
  ]);
  // ref例: "TOKI-XXXX-XXXX-XXXX TimelessAdvisor-Retainer-6mo"
  //        "TOKI-XXXX-XXXX-XXXX Workaway-Consulting-6mo"
  var type = ref.replace(/^.*TOKI-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}\s*/i, '').replace(/^TimelessAdvisor-/i, '');
  sheet.appendRow([
    new Date(), code, amount, currency, type, '入金確認済み', '', ''
  ]);
  sendEmail(NOTIFY_EMAIL,
    '【TokiStorage】入金確認 — ' + currency + ' ' + amount,
    'サービスの入金がありました。\n\nコード: ' + code + '\nタイプ: ' + type + '\n金額: ' + currency + ' ' + amount + '\n\nスプレッドシートに記録済みです。');
}

function notifyPayment(amount, currency, reference) {
  sendEmail(NOTIFY_EMAIL,
    '【TokiQR】入金検知 — ' + currency + ' ' + amount,
    'Wiseに入金がありました。\n\n金額: ' + currency + ' ' + amount + '\nReference: ' + (reference || '(なし)') + '\n\nスプレッドシートで確認してください。');
}

// ── デバッグ: トランザクション詳細確認 ──

function inspectRecentTransactions() {
  if (!WISE_API_TOKEN || !WISE_PROFILE_ID) {
    Logger.log('WISE_API_TOKEN or WISE_PROFILE_ID not set');
    return;
  }
  // まずbalance一覧を取得
  var balRes = UrlFetchApp.fetch('https://api.wise.com/v4/profiles/' + WISE_PROFILE_ID + '/balances?types=STANDARD', {
    headers: { 'Authorization': 'Bearer ' + WISE_API_TOKEN },
    muteHttpExceptions: true
  });
  if (balRes.getResponseCode() !== 200) {
    Logger.log('Balance fetch failed: ' + balRes.getResponseCode());
    return;
  }
  var balances = JSON.parse(balRes.getContentText());
  // 各通貨のbalanceから直近7日のステートメントを取得
  var end = new Date().toISOString();
  var start = new Date(Date.now() - 7 * 86400000).toISOString();
  for (var b = 0; b < balances.length; b++) {
    var bal = balances[b];
    Logger.log('=== Balance: ' + bal.currency + ' (id: ' + bal.id + ') ===');
    var url = 'https://api.wise.com/v4/profiles/' + WISE_PROFILE_ID
      + '/balances/' + bal.id + '/statements'
      + '?intervalStart=' + start + '&intervalEnd=' + end
      + '&currency=' + bal.currency + '&type=COMPACT';
    var res = UrlFetchApp.fetch(url, {
      headers: { 'Authorization': 'Bearer ' + WISE_API_TOKEN },
      muteHttpExceptions: true
    });
    if (res.getResponseCode() !== 200) continue;
    var result = JSON.parse(res.getContentText());
    var txns = result.transactions || [];
    Logger.log('Transactions found: ' + txns.length);
    for (var i = 0; i < txns.length; i++) {
      Logger.log('--- Transaction ' + (i + 1) + ' ---');
      Logger.log('type: ' + txns[i].type);
      Logger.log('amount: ' + JSON.stringify(txns[i].amount));
      Logger.log('details (FULL): ' + JSON.stringify(txns[i].details));
      Logger.log('referenceNumber: ' + txns[i].referenceNumber);
    }
  }
}

// ── Wise送金API（パートナー自動送金用）──

function resolveWiseContact(identifier) {
  if (!WISE_API_TOKEN || !WISE_PROFILE_ID) return null;
  try {
    var res = UrlFetchApp.fetch('https://api.wise.com/v1/profiles/' + WISE_PROFILE_ID + '/contacts', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + WISE_API_TOKEN,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({ identifier: identifier }),
      muteHttpExceptions: true
    });
    if (res.getResponseCode() !== 200 && res.getResponseCode() !== 201) {
      Logger.log('Wise contact error: ' + res.getResponseCode() + ' ' + res.getContentText());
      return null;
    }
    return JSON.parse(res.getContentText());
  } catch (e) {
    Logger.log('Wise contact exception: ' + e.message);
    return null;
  }
}

function createWiseQuote(contactId, amount, currency) {
  if (!WISE_API_TOKEN || !WISE_PROFILE_ID) return null;
  try {
    var res = UrlFetchApp.fetch('https://api.wise.com/v2/quotes', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + WISE_API_TOKEN,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        sourceCurrency: currency,
        targetCurrency: currency,
        targetAmount: amount,
        profile: WISE_PROFILE_ID,
        contactId: contactId
      }),
      muteHttpExceptions: true
    });
    if (res.getResponseCode() !== 200) {
      Logger.log('Wise quote error: ' + res.getResponseCode() + ' ' + res.getContentText());
      return null;
    }
    return JSON.parse(res.getContentText());
  } catch (e) {
    Logger.log('Wise quote exception: ' + e.message);
    return null;
  }
}

function createWiseTransfer(targetAccount, quoteId, reference) {
  if (!WISE_API_TOKEN) return null;
  try {
    var res = UrlFetchApp.fetch('https://api.wise.com/v1/transfers', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + WISE_API_TOKEN,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        targetAccount: targetAccount,
        quoteUuid: quoteId,
        customerTransactionId: Utilities.getUuid(),
        details: { reference: reference }
      }),
      muteHttpExceptions: true
    });
    if (res.getResponseCode() !== 200) {
      Logger.log('Wise transfer error: ' + res.getResponseCode() + ' ' + res.getContentText());
      return null;
    }
    return JSON.parse(res.getContentText());
  } catch (e) {
    Logger.log('Wise transfer exception: ' + e.message);
    return null;
  }
}

function fundWiseTransfer(transferId) {
  if (!WISE_API_TOKEN || !WISE_PROFILE_ID) return null;
  try {
    var res = UrlFetchApp.fetch(
      'https://api.wise.com/v3/profiles/' + WISE_PROFILE_ID + '/transfers/' + transferId + '/payments', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + WISE_API_TOKEN,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({ type: 'BALANCE' }),
      muteHttpExceptions: true
    });
    if (res.getResponseCode() !== 200 && res.getResponseCode() !== 201) {
      Logger.log('Wise fund error: ' + res.getResponseCode() + ' ' + res.getContentText());
      return null;
    }
    return JSON.parse(res.getContentText());
  } catch (e) {
    Logger.log('Wise fund exception: ' + e.message);
    return null;
  }
}
