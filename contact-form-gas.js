/**
 * TokiStorage Contact Form — Google Apps Script
 *
 * セットアップ手順:
 * 1. Google Sheets で新規スプレッドシートを作成
 * 2. 拡張機能 > Apps Script を開く
 * 3. このコードを貼り付けて保存
 * 4. NOTIFY_EMAIL を自分のメールアドレスに変更
 * 5. デプロイ > 新しいデプロイ > ウェブアプリ
 *    - 実行者: 自分
 *    - アクセス: 全員
 * 6. デプロイURLをコピーし、contact-form.js の GAS_WEB_APP_URL を差し替え
 */

var NOTIFY_EMAIL = 'business@satotakuya.jp';

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // ヘッダー行がなければ作成
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['日時', '名前', '連絡先', 'メッセージ', 'ページ', 'URL', 'ステータス']);
  }

  try {
    var raw = e.postData.contents;
    var data = JSON.parse(raw);

    sheet.appendRow([
      new Date(),
      data.name || '',
      data.contact || '',
      data.message || '',
      data.page || '',
      data.url || '',
      'OK'
    ]);

    // メール通知
    var subject = 'TokiStorage お問い合わせ: ' + (data.name || '名前なし');
    var body = '名前: ' + (data.name || '') + '\n'
             + '連絡先: ' + (data.contact || '') + '\n'
             + 'メッセージ:\n' + (data.message || '') + '\n\n'
             + 'ページ: ' + (data.page || '') + '\n'
             + 'URL: ' + (data.url || '') + '\n'
             + '日時: ' + new Date().toLocaleString('ja-JP');

    MailApp.sendEmail(NOTIFY_EMAIL, subject, body);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    // エラーもシートに記録（デバッグ用）
    sheet.appendRow([
      new Date(),
      'ERROR',
      err.toString(),
      e.postData ? e.postData.contents : 'no postData',
      e.postData ? e.postData.type : 'no type',
      '',
      'ERROR'
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// GET リクエスト（テスト用）
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'TokiStorage Contact Form API' }))
    .setMimeType(ContentService.MimeType.JSON);
}
