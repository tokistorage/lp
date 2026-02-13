/**
 * TokiStorage — Google Apps Script
 * コンタクトフォーム + ページビュートラッカー
 *
 * スプレッドシートに2つのシートを用意:
 *   1. 「お問い合わせ」シート（コンタクトフォーム）
 *   2. 「アクセスログ」シート（ページビュー）
 */

var SPREADSHEET_ID = '1lxrf5hLebwaUqt6WxeIjvVYUEYZntV9Kj-TrVzfkl0A';
var NOTIFY_EMAIL = 'tokistorage1000@gmail.com';

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  }
  return sheet;
}

function doPost(e) {
  try {
    var raw = e.postData.contents;
    var data = JSON.parse(raw);
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // ページビュー
    if (data.type === 'pageview') {
      return handlePageview(ss, data);
    }

    // コンタクトフォーム
    return handleContact(ss, data);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handlePageview(ss, data) {
  try {
    var sheet = getOrCreateSheet(ss, 'アクセスログ', [
      '日時', 'VisitorID', 'ページ', 'パス', '流入元',
      'デバイス', '画面', '言語', 'リファラー', 'タイムゾーン'
    ]);
    sheet.appendRow([
      new Date(),
      data.vid || '',
      data.page || '',
      data.path || '',
      data.source || '',
      data.device || '',
      data.screen || '',
      data.lang || '',
      data.referrer || '',
      data.timezone || ''
    ]);
  } catch (sheetErr) {
    // シート書き込み失敗は無視
  }

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleContact(ss, data) {
  // スプレッドシート記録（失敗してもメールは送る）
  try {
    var sheet = getOrCreateSheet(ss, 'お問い合わせ', [
      '日時', '名前', '連絡先', 'メッセージ', 'ページ', 'URL',
      'デバイス', '画面', 'ビューポート', 'UA', '言語', 'リファラー', 'タイムゾーン',
      'ステータス'
    ]);
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
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'TokiStorage API' }))
    .setMimeType(ContentService.MimeType.JSON);
}
