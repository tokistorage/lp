/**
 * Pearl Soap 補充依頼フォーム受信スクリプト
 *
 * セットアップ手順:
 * 1. Google スプレッドシートを新規作成
 * 2. 拡張機能 → Apps Script を開く
 * 3. このコードを貼り付けて保存
 * 4. デプロイ → 新しいデプロイ → ウェブアプリ
 *    - 実行するユーザー: 自分
 *    - アクセスできるユーザー: 全員
 * 5. デプロイ後に表示されるURLをコピー
 * 6. soap-refill.html の endpoint 変数にURLを設定
 */

// スプレッドシートのシート名
const SHEET_NAME = '補充依頼';

// 初回セットアップ: ヘッダー行を作成
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // ヘッダー設定
  const headers = [
    '受付日時',
    'お名前',
    '連絡先',
    '郵便番号',
    '住所',
    'メッセージ',
    '緯度',
    '経度',
    'Googleマップ',
    'ステータス',
    '発送日',
    '備考'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);

  // 列幅調整
  sheet.setColumnWidth(1, 150);  // 受付日時
  sheet.setColumnWidth(2, 100);  // お名前
  sheet.setColumnWidth(3, 150);  // 連絡先
  sheet.setColumnWidth(4, 100);  // 郵便番号
  sheet.setColumnWidth(5, 300);  // 住所
  sheet.setColumnWidth(6, 200);  // メッセージ
  sheet.setColumnWidth(9, 200);  // Googleマップ
  sheet.setColumnWidth(10, 80);  // ステータス

  Logger.log('シートのセットアップが完了しました');
}

// POSTリクエストを受信
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      setupSheet();
      sheet = ss.getSheetByName(SHEET_NAME);
    }

    // 受付日時（日本時間）
    const now = new Date();
    const jstTime = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');

    // Googleマップリンク
    let mapLink = '';
    if (data.lat && data.lng) {
      mapLink = `https://www.google.com/maps?q=${data.lat},${data.lng}`;
    }

    // データを追加
    const row = [
      jstTime,
      data.name || '',
      data.contact || '',
      data.postal || '',
      data.address || '',
      data.message || '',
      data.lat || '',
      data.lng || '',
      mapLink,
      '未対応',  // 初期ステータス
      '',        // 発送日
      ''         // 備考
    ];

    sheet.appendRow(row);

    // メール通知（オプション）
    sendNotificationEmail(data, jstTime);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('エラー: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// GETリクエスト（テスト用）
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'ok',
      message: 'Pearl Soap 補充依頼 API is running'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// メール通知（必要に応じてコメント解除）
function sendNotificationEmail(data, timestamp) {
  // 通知先メールアドレスを設定
  const NOTIFY_EMAIL = ''; // 例: 'your-email@example.com'

  if (!NOTIFY_EMAIL) return;

  const subject = `【Pearl Soap】補充依頼: ${data.name}様`;

  let body = `Pearl Soapの補充依頼がありました。\n\n`;
  body += `受付日時: ${timestamp}\n`;
  body += `お名前: ${data.name}\n`;
  body += `連絡先: ${data.contact}\n`;
  body += `郵便番号: ${data.postal}\n`;
  body += `住所: ${data.address}\n`;

  if (data.message) {
    body += `メッセージ: ${data.message}\n`;
  }

  if (data.lat && data.lng) {
    body += `\n地図: https://www.google.com/maps?q=${data.lat},${data.lng}\n`;
  }

  body += `\n---\nスプレッドシートで確認: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}`;

  GmailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}

// テスト用関数
function testPost() {
  const testData = {
    postData: {
      contents: JSON.stringify({
        name: 'テスト太郎',
        contact: '090-1234-5678',
        postal: '279-0014',
        address: '千葉県浦安市明海2-11-13',
        message: 'テストメッセージです',
        lat: '35.6432',
        lng: '139.9012'
      })
    }
  };

  const result = doPost(testData);
  Logger.log(result.getContent());
}
