/**
 * TokiStorage Contact Form — Google Apps Script
 *
 * セットアップ手順:
 * 1. Google Sheets で新規スプレッドシートを作成
 * 2. 拡張機能 > Apps Script を開く
 * 3. このコードを貼り付けて保存
 * 4. デプロイ > 新しいデプロイ > ウェブアプリ
 *    - 実行者: 自分
 *    - アクセス: 全員
 * 5. デプロイURLをコピーし、contact-form.js の API_URL を差し替え
 */

var NOTIFY_EMAIL = 'tokistorage1000@gmail.com';

function doPost(e) {
  try {
    var raw = e.postData.contents;
    var data = JSON.parse(raw);

    // スプレッドシート記録（失敗してもメールは送る）
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      if (ss) {
        var sheet = ss.getActiveSheet();
        if (sheet.getLastRow() === 0) {
          sheet.appendRow([
            '日時', '名前', '連絡先', 'メッセージ', 'ページ', 'URL',
            'デバイス', '画面', 'ビューポート', 'UA', '言語', 'リファラー', 'タイムゾーン',
            'ステータス'
          ]);
        }
        sheet.appendRow([
          new Date(),
          data.name || '',
          data.contact || '',
          data.message || '',
          data.page || '',
          data.url || '',
          data.device || '',
          data.screen || '',
          data.viewport || '',
          data.ua || '',
          data.lang || '',
          data.referrer || '',
          data.timezone || '',
          'OK'
        ]);
      }
    } catch (sheetErr) {
      // シート書き込み失敗してもメールは送る
    }

    // メール通知
    var subject = 'TokiStorage お問い合わせ: ' + (data.name || '名前なし');
    var body = '名前: ' + (data.name || '') + '\n'
             + '連絡先: ' + (data.contact || '') + '\n'
             + 'メッセージ:\n' + (data.message || '') + '\n\n'
             + 'ページ: ' + (data.page || '') + '\n'
             + 'URL: ' + (data.url || '') + '\n\n'
             + '--- デバイス情報 ---\n'
             + 'デバイス: ' + (data.device || '') + '\n'
             + '画面: ' + (data.screen || '') + '\n'
             + 'ビューポート: ' + (data.viewport || '') + '\n'
             + '言語: ' + (data.lang || '') + '\n'
             + 'リファラー: ' + (data.referrer || '') + '\n'
             + 'タイムゾーン: ' + (data.timezone || '') + '\n'
             + 'UA: ' + (data.ua || '') + '\n'
             + '日時: ' + new Date().toLocaleString('ja-JP');

    MailApp.sendEmail(NOTIFY_EMAIL, subject, body);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'TokiStorage Contact Form API' }))
    .setMimeType(ContentService.MimeType.JSON);
}
