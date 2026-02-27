/**
 * 注文処理 (orders.gs)
 *
 * 注文コードシート（Wise入金で自動登録）:
 *   '日時', 'コード', '金額', '通貨', 'ステータス', '使用日時'
 *
 * 注文シートヘッダー（既存互換）:
 *   '日時', '注文番号', 'ステータス', '商品', 'Wisetag', '(空)',
 *   '(空)', '(空)', '(空)', '(空)', 'QR URL',
 *   '備考', 'パートナー',
 *   'デバイス', '画面', 'UA', '言語', 'タイムゾーン',
 *   '通貨', '合計金額',
 *   'GitHub保管', 'NDL納本', '佐渡保管', 'Maui保管', '(空)',
 *   '保管処理', 'DIY'
 */

var ORDER_CODE_SHEET_NAME = '注文コード';

function registerOrderCode(ss, code, amount, currency) {
  var sheet = getOrCreateSheet(ss, ORDER_CODE_SHEET_NAME, [
    '日時', 'コード', '金額', '通貨', 'ステータス', '使用日時'
  ]);
  // 重複チェック
  if (sheet.getLastRow() >= 2) {
    var rows = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < rows.length; i++) {
      if (rows[i][0] === code) return;
    }
  }
  sheet.appendRow([new Date(), code, amount, currency, '未使用', '']);
}

function handleOrderActivation(ss, data) {
  var code = (data.code || '').trim().toUpperCase();
  if (!/^TOKI-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
    return jsonResponse({ success: false, error: 'invalid_code' });
  }

  var sheet = ss.getSheetByName(ORDER_CODE_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) {
    return jsonResponse({ success: false, error: 'not_found' });
  }

  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][1] === code) {
      if (rows[i][4] === '使用済み') {
        return jsonResponse({ success: false, error: 'used' });
      }
      // コードを使用済みに
      sheet.getRange(i + 2, 5).setValue('使用済み');
      sheet.getRange(i + 2, 6).setValue(new Date());

      // 注文を作成
      createOrderFromActivation(ss, data, code);
      return jsonResponse({ success: true });
    }
  }

  return jsonResponse({ success: false, error: 'not_found' });
}

function createOrderFromActivation(ss, data, code) {
  var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd');
  var sheet = getOrCreateSheet(ss, '注文', [
    '日時', '注文番号', 'ステータス', '商品', 'Wisetag', '(空)',
    '(空)', '(空)', '(空)', '(空)', 'QR URL',
    '備考', 'パートナー',
    'デバイス', '画面', 'UA', '言語', 'タイムゾーン',
    '通貨', '合計金額',
    'GitHub保管', 'NDL納本', '佐渡保管', 'Maui保管', '(空)',
    '保管処理', 'DIY'
  ]);
  var seq = sheet.getLastRow();
  var orderId = 'TQ-' + today + '-' + ('0000' + seq).slice(-4);

  var productName = data.product === 'quartz'
    ? 'クォーツガラスQR（¥50,000〜）'
    : 'ラミネートQRシート（¥5,000〜）';
  var currency = data.currency || 'JPY';
  var total = calculateTotal(data.product, currency, data.storageSado, data.storageMaui);

  try {
    sheet.appendRow([
      new Date(), orderId, '入金済み', productName,
      data.wisetag || '', '',
      '', '', '', '',
      data.qrUrl || '', data.notes || '', data.ref || '',
      data.device || '', data.screen || '', data.ua || '', data.lang || '', data.timezone || '',
      currency, total,
      data.storageGithub ? 'Yes' : '', data.storageNdl ? 'Yes' : '',
      data.storageSado ? 'Yes' : '', data.storageMaui ? 'Yes' : '',
      '', '', data.diy ? 'Yes' : ''
    ]);
  } catch (sheetErr) {}

  // パートナー手数料自動送金
  if (data.ref) {
    payPartnerCommission(ss, orderId, data.ref, total, currency, data.diy);
  }

  var symbol = currency === 'USD' ? '$' : '¥';
  var priceDisplay = symbol + total.toLocaleString();
  var adminBody = '注文がアクティベートされました。\n\n'
    + '注文番号: ' + orderId + '\n'
    + '注文コード: ' + code + '\n'
    + '商品: ' + productName + '\n'
    + 'Wisetag: ' + (data.wisetag || '') + '\n'
    + '金額: ' + priceDisplay + '（' + currency + '）\n'
    + 'QR URL: ' + (data.qrUrl || '') + '\n'
    + 'パートナー: ' + (data.ref || 'なし') + '\n'
    + 'DIY: ' + (data.diy ? 'はい' : 'いいえ') + '\n\n'
    + '保管オプション:\n'
    + '  GitHub: ' + (data.storageGithub ? 'Yes' : 'No') + '\n'
    + '  NDL: ' + (data.storageNdl ? 'Yes' : 'No') + '\n'
    + '  佐渡: ' + (data.storageSado ? 'Yes' : 'No') + '\n'
    + '  Maui: ' + (data.storageMaui ? 'Yes' : 'No');
  sendEmail(NOTIFY_EMAIL, '【TokiQR】注文アクティベート ' + orderId + ' — ' + productName, adminBody);
}

function getOrders() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('注文');
  if (!sheet || sheet.getLastRow() < 2) return [];
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 29).getValues();
  return data.map(function(r, i) {
    return {
      row: i + 2, date: r[0], orderId: r[1], status: r[2], product: r[3],
      wisetag: r[4],
      qrUrl: r[10], notes: r[11], ref: r[12],
      currency: r[18] || 'JPY', total: r[19] || 0,
      storageGithub: r[20] || '', storageNdl: r[21] || '',
      storageSado: r[22] || '', storageMaui: r[23] || '',
      storageProcessed: r[25] || '', diy: r[26] || ''
    };
  });
}

function payPartnerCommission(ss, orderId, ref, total, currency, isDiy) {
  try {
    var share = isDiy ? PARTNER_SHARE_DIY : PARTNER_SHARE;
    var commission = Math.floor(total * share);
    if (commission <= 0) return;

    // 1. Wise Contact APIでWisetag → contactId解決
    var contact = resolveWiseContact(ref);
    if (!contact || !contact.id) {
      throw new Error('Contact解決失敗: ' + ref);
    }

    // 2. Quote作成（contactIdで自動recipient解決）
    var quote = createWiseQuote(contact.id, commission, currency);
    if (!quote || !quote.id) {
      throw new Error('Quote作成失敗');
    }
    var targetAccount = quote.targetAccount;
    if (!targetAccount) {
      throw new Error('Quote内にtargetAccountなし');
    }

    // 3. Transfer作成
    var transfer = createWiseTransfer(targetAccount, quote.id, 'TokiQR commission ' + orderId);
    if (!transfer || !transfer.id) {
      throw new Error('Transfer作成失敗');
    }

    // 4. Balance から送金実行
    var funding = fundWiseTransfer(transfer.id);
    if (!funding) {
      throw new Error('Fund失敗 (transferId: ' + transfer.id + ')');
    }

    // 5. イベントログに記録
    try {
      var logSheet = getOrCreateSheet(ss, 'イベントログ', [
        '日時', 'アクション', '詳細', 'デバイス', 'パス'
      ]);
      logSheet.insertRowAfter(1);
      logSheet.getRange(2, 1, 1, 5).setValues([[
        new Date(), 'partner_payout',
        orderId + ' | ' + ref + ' | ' + currency + ' ' + commission + ' (' + (share * 100) + '%) | transfer:' + transfer.id,
        '', ''
      ]]);
    } catch (logErr) {}

    // 6. 管理者通知
    sendEmail(NOTIFY_EMAIL,
      '【TokiQR】パートナー送金完了 ' + orderId + ' → ' + ref,
      'パートナーへの手数料を自動送金しました。\n\n'
      + '注文番号: ' + orderId + '\n'
      + 'パートナー: ' + ref + '\n'
      + '注文金額: ' + currency + ' ' + total + '\n'
      + '手数料(' + (share * 100) + '%): ' + currency + ' ' + commission + '\n'
      + 'WiseTransferId: ' + transfer.id);

  } catch (e) {
    Logger.log('Partner payout failed for ' + orderId + ': ' + e.message);
    sendEmail(NOTIFY_EMAIL,
      '【TokiQR】パートナー送金失敗 ' + orderId,
      'パートナーへの自動送金が失敗しました。手動で対応してください。\n\n'
      + '注文番号: ' + orderId + '\n'
      + 'パートナー: ' + ref + '\n'
      + '注文金額: ' + currency + ' ' + total + '\n'
      + 'DIY: ' + (isDiy ? 'はい' : 'いいえ') + '\n'
      + 'エラー: ' + e.message);
  }
}

