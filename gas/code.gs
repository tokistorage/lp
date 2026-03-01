/**
 * TokiStorage — Google Apps Script (Entry Point)
 *
 * GASプロジェクト内のファイル構成:
 *   code.gs       — エントリポイント・定数・ヘルパー（このファイル）
 *   wise.gs       — Wise webhook・API
 *   orders.gs     — 注文処理
 *   credits.gs    — クレジットコード（マルチQR + 特集権）
 *   pipeline.gs   — 保管パイプライン（GitHub + NDL）
 *   newsletter.gs — ニュースレター自動更新
 *   ndl.gs        — NDL特集シリーズ（series_open / ndl_submit）
 *   monitor.gs    — モニタープログラム（申し込み / フィードバック）
 *   advisor.gs    — タイムレスアドバイザー（トークンライフサイクル）
 *   reports.gs    — デイリー / 月次レポート
 *
 * タイマートリガー（GASエディタで設定）:
 *   - sendDailyReport()          → 毎日 9:00 JST
 *   - sendMonthlyPartnerReport() → 毎月1日 9:00 JST
 *   - processStoragePipeline()   → 毎日 9:00 JST
 *   - advanceNewsletterIssue()   → 毎日 9:00 JST
 *   - sendMonthlySeriesReport()  → 毎月1日 9:00 JST
 *   - checkExpiredAdvisors()     → 毎日 9:00 JST
 */

var SPREADSHEET_ID = '1lxrf5hLebwaUqt6WxeIjvVYUEYZntV9Kj-TrVzfkl0A';
var NOTIFY_EMAIL = 'tokistorage1000@gmail.com';
var WISE_BUSINESS_ID = 'dsbdb3';
var PARTNER_SHARE = 0.10;
var PARTNER_SHARE_DIY = 0.90;
var DEV_VIDS = ['40a15079-bc04-4d56-8b39-1fca77e0a100'];

// シークレットはScript Propertiesで管理（GASエディタ → プロジェクトの設定 → スクリプトプロパティ）
// キー: WISE_API_TOKEN, WISE_PROFILE_ID, GITHUB_TOKEN
var _props = PropertiesService.getScriptProperties();
var WISE_API_TOKEN = _props.getProperty('WISE_API_TOKEN') || '';
var WISE_PROFILE_ID = _props.getProperty('WISE_PROFILE_ID') || '';
var GITHUB_TOKEN = _props.getProperty('GITHUB_TOKEN') || '';
var GITHUB_REPO = 'tokistorage/lp';
var GITHUB_REPO_QR = 'tokistorage/qr';
var GITHUB_API = 'https://api.github.com';
var CURRENT_NEWSLETTER_ISSUE = '2026-04';

var PRICES = { laminate: { JPY: 5000, USD: 33 }, quartz: { JPY: 50000, USD: 333 }, credit: { JPY: 150, USD: 1 } };
var PRICES_TOKUSHU = { JPY: 9900, USD: 66 };
var CREDIT_SHEET_NAME = 'クレジットコード';

// ── ヘルパー ──

function sendEmail(recipient, subject, body, options) {
  MailApp.sendEmail(recipient, subject, body, options || {});
}

function calculateTotal(product, storageSado, storageMaui) {
  var base = PRICES[product] ? PRICES[product]['JPY'] : 5000;
  var copies = 1;
  if (storageSado) copies++;
  if (storageMaui) copies++;
  return base * copies;
}

function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── エントリポイント ──

function doPost(e) {
  try {
    var raw = e.postData.contents;
    var data = JSON.parse(raw);
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (data.event_type) return handleWiseWebhook(ss, data, raw);
    if (data.type === 'pageview') return handlePageview(ss, data);
    if (data.type === 'event') return handleEvent(ss, data);
    if (data.type === 'credit_activate') return handleCreditActivation(ss, data);
    if (data.type === 'order_activate') return handleOrderActivation(ss, data);
    if (data.type === 'series_open') return handleSeriesOpen(ss, data);
    if (data.type === 'ndl_submit') return handleNdlSubmit(ss, data);
    if (data.type === 'series_rename') return handleSeriesRename(ss, data);
    if (data.type === 'monitor_apply') return handleMonitorApply(ss, data);
    if (data.type === 'monitor_feedback') return handleMonitorFeedback(ss, data);
    if (data.type === 'advisor_status') return handleAdvisorStatus(ss, data);
    if (data.type === 'advisor_start_session') return handleAdvisorStartSession(ss, data);
    if (data.type === 'advisor_complete') return handleAdvisorComplete(ss, data);
    return handleContact(ss, data);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return jsonResponse({ status: 'ok', message: 'TokiStorage API' });
}

// ── トラッキング ──

function handlePageview(ss, data) {
  try {
    var vid = data.vid || '';
    var isDev = DEV_VIDS.indexOf(vid) !== -1;
    var sheet = getOrCreateSheet(ss, 'アクセスログ', [
      '日時', 'VisitorID', 'タイプ', 'ページ', 'パス', '流入元',
      'デバイス', '画面', '言語', 'リファラー', 'タイムゾーン'
    ]);
    sheet.insertRowAfter(1);
    sheet.getRange(2, 1, 1, 11).setValues([[
      new Date(), vid, isDev ? 'dev' : 'visitor',
      data.page || '', data.path || '', data.source || '',
      data.device || '', data.screen || '', data.lang || '',
      data.referrer || '', data.timezone || ''
    ]]);
  } catch (sheetErr) {}
  return jsonResponse({ success: true });
}

function handleEvent(ss, data) {
  try {
    var sheet = getOrCreateSheet(ss, 'イベントログ', [
      '日時', 'アクション', '詳細', 'デバイス', 'パス'
    ]);
    sheet.insertRowAfter(1);
    sheet.getRange(2, 1, 1, 5).setValues([[
      new Date(), data.action || '', data.meta || '',
      data.device || '', data.path || ''
    ]]);
  } catch (sheetErr) {}
  return jsonResponse({ success: true });
}

function handleContact(ss, data) {
  try {
    var sheet = getOrCreateSheet(ss, 'お問い合わせ', [
      '日時', '名前', '連絡先', 'メッセージ', 'ページ', 'URL',
      'デバイス', '画面', 'ビューポート', 'UA', '言語', 'リファラー', 'タイムゾーン',
      'ステータス'
    ]);
    sheet.appendRow([
      new Date(), data.name || '', data.contact || '', data.message || '',
      data.page || '', data.url || '', data.device || '', data.screen || '',
      data.viewport || '', data.ua || '', data.lang || '', data.referrer || '',
      data.timezone || '', 'OK'
    ]);
  } catch (sheetErr) {}

  var subject = 'TokiStorage お問い合わせ: ' + (data.name || '名前なし');
  var body = '名前: ' + (data.name || '') + '\n'
    + '連絡先: ' + (data.contact || '') + '\n'
    + 'メッセージ:\n' + (data.message || '') + '\n\n'
    + 'ページ: ' + (data.page || '') + '\n'
    + 'URL: ' + (data.url || '') + '\n\n'
    + '日時: ' + new Date().toLocaleString('ja-JP');
  sendEmail(NOTIFY_EMAIL, subject, body);

  return jsonResponse({ success: true });
}
