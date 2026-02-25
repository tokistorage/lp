/**
 * 注文処理 (orders.gs)
 */

function handleOrder(ss, data) {
  var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd');
  var sheet = getOrCreateSheet(ss, '注文', [
    '日時', '注文番号', 'ステータス', '商品', '名前', '連絡先',
    '〒', '都道府県', '市区町村・番地', '建物名', 'QR URL',
    '備考', 'パートナー (Wise Tag)',
    'デバイス', '画面', 'UA', '言語', 'タイムゾーン',
    '通貨', '合計金額',
    'GitHub保管', 'NDL納本', '佐渡保管', 'Maui保管', '個人情報含む',
    '保管処理', 'DIY'
  ]);
  var seq = sheet.getLastRow();
  var orderId = 'TQ-' + today + '-' + ('0000' + seq).slice(-4);

  var productName = data.product === 'quartz'
    ? 'クォーツガラスQR（¥50,000〜）'
    : 'ラミネートQRシート（¥5,000〜）';
  var currency = data.currency || 'JPY';
  var total = calculateTotal(data.product, currency, data.storageSado, data.storageMaui);
  var symbol = currency === 'USD' ? '$' : '¥';
  var priceDisplay = symbol + total.toLocaleString();

  try {
    sheet.appendRow([
      new Date(), orderId, '未払い', productName,
      data.name || '', data.contact || '',
      data.postal || '', data.prefecture || '', data.city || '', data.building || '',
      data.qrUrl || '', data.notes || '', data.ref || '',
      data.device || '', data.screen || '', data.ua || '', data.lang || '', data.timezone || '',
      currency, total,
      data.storageGithub ? 'Yes' : '', data.storageNdl ? 'Yes' : '',
      data.storageSado ? 'Yes' : '', data.storageMaui ? 'Yes' : '',
      data.includePersonal ? 'Yes' : '', '', data.diy ? 'Yes' : ''
    ]);
  } catch (sheetErr) {}

  var adminBody = '新規注文が入りました。\n\n注文番号: ' + orderId + '\n商品: ' + productName + '\n\n'
    + '名前: ' + (data.name || '') + '\n連絡先: ' + (data.contact || '') + '\n\n'
    + '金額: ' + priceDisplay + '（' + currency + '）\n'
    + '決済リンク: ' + buildWiseLink(total, currency, orderId) + '\n'
    + 'パートナー: ' + (data.ref || 'なし') + '\nDIY: ' + (data.diy ? 'はい' : 'いいえ');
  sendEmail(NOTIFY_EMAIL, '【TokiQR】新規注文 ' + orderId + ' — ' + productName, adminBody);

  var contact = data.contact || '';
  if (contact.indexOf('@') !== -1) {
    var wiseLink = buildWiseLink(total, currency, orderId);
    var custBody = (data.name || 'お客') + ' 様\n\nご注文ありがとうございます。\n\n注文番号: ' + orderId + '\n商品: ' + productName + '\n金額: ' + priceDisplay + '（税込・送料込み）\n\n以下のリンクからWiseでお支払いください:\n' + wiseLink + '\n\n— TokiStorage\nhttps://tokistorage.github.io/';
    sendEmail(NOTIFY_EMAIL, '【TokiQR】ご注文ありがとうございます（' + orderId + '）', custBody, { replyTo: NOTIFY_EMAIL, to: contact });
  }

  return jsonResponse({ success: true, orderId: orderId });
}

function getOrders() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('注文');
  if (!sheet || sheet.getLastRow() < 2) return [];
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 29).getValues();
  return data.map(function(r, i) {
    return {
      row: i + 2, date: r[0], orderId: r[1], status: r[2], product: r[3],
      name: r[4], contact: r[5], postal: r[6], prefecture: r[7], city: r[8],
      building: r[9], qrUrl: r[10], notes: r[11], ref: r[12],
      currency: r[18] || 'JPY', total: r[19] || 0,
      storageGithub: r[20] || '', storageNdl: r[21] || '',
      storageSado: r[22] || '', storageMaui: r[23] || '',
      includePersonal: r[24] || '', storageProcessed: r[25] || '', diy: r[26] || ''
    };
  });
}

function getPrice(product) {
  if (product.indexOf('50,000') !== -1) return 50000;
  return 5000;
}
