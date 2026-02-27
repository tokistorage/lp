/**
 * Wise Webhook + API (wise.gs)
 */

function isOrderPayment(ref) {
  return /laminate|quartz/i.test(ref);
}

function processTokiCode(ss, tokiMatch, ref, amt, cur) {
  var code = tokiMatch[0];

  // 注文コード（laminate/quartz含む）
  if (isOrderPayment(ref)) {
    registerOrderCode(ss, code, amt, cur);
    sendEmail(NOTIFY_EMAIL,
      '【TokiQR】注文入金 ' + cur + ' ' + amt + ' — 注文コード自動登録済み',
      'Wiseに注文の入金がありました。\n\n'
        + '金額: ' + cur + ' ' + amt + '\n'
        + 'コード: ' + code + '\n'
        + 'Reference: ' + ref + '\n\n'
        + 'ユーザーがアクティベートすると注文が作成されます。');
    return;
  }

  // 特集権コード
  if (/Tokushu/i.test(ref)) {
    var count = Math.floor(amt / (PRICES_TOKUSHU[cur] || PRICES_TOKUSHU['JPY']));
    if (count < 1) count = 1;
    registerCreditCode(ss, code, count, 'tokushu');
    sendEmail(NOTIFY_EMAIL,
      '【TokiQR】特集権入金 ' + cur + ' ' + amt + ' — コード自動登録済み',
      'Wiseに入金がありました。\n\n'
        + '金額: ' + cur + ' ' + amt + '\n'
        + 'コード: ' + code + '\n'
        + '特集権数: ' + count + '\n\n'
        + 'コードレス購入フローで自動登録しました。');
    return;
  }

  // マルチQRクレジットコード
  var count = Math.floor(amt / (PRICES.credit[cur] || PRICES.credit['JPY']));
  if (count < 1) count = 1;
  registerCreditCode(ss, code, count, 'multiQR');
  sendEmail(NOTIFY_EMAIL,
    '【TokiQR】マルチQR入金 ' + cur + ' ' + amt + ' — コード自動登録済み',
    'Wiseに入金がありました。\n\n'
      + '金額: ' + cur + ' ' + amt + '\n'
      + 'コード: ' + code + '\n'
      + 'マルチQR数: ' + count + '\n\n'
      + 'コードレス購入フローで自動登録しました。');
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
          var orderMatch = ref.match(/TQ-\d{8}-\d{4}/);
          if (orderMatch) {
            confirmOrder(ss, orderMatch[0], transfer.targetValue || transfer.sourceValue, transfer.targetCurrency || transfer.sourceCurrency);
          }
          var tokiMatch = ref.match(/TOKI-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/);
          if (!orderMatch && tokiMatch) {
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
      var ref = fetchRecentCreditReference(profileId, balanceId, d.currency, d.amount, d.occurred_at);
      logSheet.getRange(2, 5).setValue(ref || '(API照会済み・該当なし)');
      if (ref) {
        var orderMatch = ref.match(/TQ-\d{8}-\d{4}/);
        if (orderMatch) {
          confirmOrder(ss, orderMatch[0], d.amount, d.currency);
        } else {
          var tokiMatch = ref.match(/TOKI-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/);
          if (tokiMatch) {
            processTokiCode(ss, tokiMatch, ref, d.amount, d.currency);
          } else {
            notifyPayment(d.amount, d.currency, ref);
          }
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
        return (t.details && t.details.description) || (t.details && t.details.reference) || '';
      }
    }
    return null;
  } catch (e) { return null; }
}

function confirmOrder(ss, orderId, amount, currency) {
  var sheet = ss.getSheetByName('注文');
  if (!sheet || sheet.getLastRow() < 2) return;
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 28).getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][1] === orderId && data[i][2].indexOf('未払い') !== -1) {
      sheet.getRange(i + 2, 3).setValue('入金済み');
      var productName = data[i][3];
      var wisetag = data[i][4];
      var customerContact = data[i][5];

      if (productName.indexOf('クレジット') !== -1) {
        var creditCount = Math.floor(amount / PRICES.credit[currency]);
        if (creditCount < 1) creditCount = 1;
        var code = generateCreditCode(ss, creditCount, customerContact, orderId);
        sendEmail(NOTIFY_EMAIL,
          '【TokiQR】入金確認 ' + orderId + ' — クレジットコード発行済み',
          '注文番号: ' + orderId + '\nWisetag: ' + wisetag + '\n入金額: ' + currency + ' ' + amount + '\nクレジット数: ' + creditCount + '\nコード: ' + code);
        if (customerContact.indexOf('@') !== -1) {
          sendEmail(NOTIFY_EMAIL,
            '【TokiQR】クレジットコードのお届け（' + orderId + '）',
            (wisetag || 'お客') + ' 様\n\nご入金ありがとうございます。\nコード: ' + code + '\nクレジット数: ' + creditCount + '\n\nhttps://tokistorage.github.io/qr/credits.html\n\n— TokiStorage',
            { replyTo: NOTIFY_EMAIL, to: customerContact });
        }
        return;
      }

      sendEmail(NOTIFY_EMAIL,
        '【TokiQR】入金確認 ' + orderId + ' — 自動更新済み',
        '注文番号: ' + orderId + '\nWisetag: ' + wisetag + '\n入金額: ' + currency + ' ' + amount + '\n\nステータスを「入金済み」に自動更新しました。');
      return;
    }
  }
}

function notifyPayment(amount, currency, reference) {
  sendEmail(NOTIFY_EMAIL,
    '【TokiQR】入金検知 — ' + currency + ' ' + amount,
    'Wiseに入金がありました。\n\n金額: ' + currency + ' ' + amount + '\nReference: ' + (reference || '(なし)') + '\n\nスプレッドシートで確認してください。');
}
