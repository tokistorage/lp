/**
 * サービス — トークンライフサイクル (advisor.gs)
 *
 * シートヘッダー:
 *   '日時', 'コード', '金額', '通貨', 'タイプ', 'ステータス', '開始日', '終了日'
 *
 * ステータス遷移:
 *   入金確認済み (activated) → セッション中 (active) → 実施済 (completed) / 権利終了 (expired)
 *
 * タイプ:
 *   SpotConsultation       → spot      (即完了)
 *   Retainer-6mo           → annual    (6ヶ月)
 *   Workaway-Consulting-6mo → workaway (6ヶ月)
 *   OffGrid-Consulting-6mo  → offgrid  (6ヶ月)
 */

var ADVISOR_SHEET_NAME = 'アドバイザー';
var ADVISOR_HEADERS = ['日時', 'コード', '金額', '通貨', 'タイプ', 'ステータス', '開始日', '終了日'];

var STATUS_MAP = {
  '入金確認済み': 'activated',
  'セッション中': 'active',
  '実施済': 'completed',
  '権利終了': 'expired'
};

var TYPE_MAP = {
  'SpotConsultation': 'spot',
  'Retainer-6mo': 'annual',
  'Workaway-Consulting-6mo': 'workaway',
  'OffGrid-Consulting-6mo': 'offgrid'
};

// 6ヶ月契約タイプ（期間管理・自動期限切れ対象）
var SIX_MONTH_TYPES = { 'Retainer-6mo': true, 'Workaway-Consulting-6mo': true, 'OffGrid-Consulting-6mo': true };

/**
 * advisor_status — トークン状態一括取得（クライアント用）
 *
 * POST { type: "advisor_status", codes: ["TOKI-XXXX-...", ...] }
 * → { success: true, tokens: { "TOKI-XXXX-...": { status, startDate, type } } }
 */
function handleAdvisorStatus(ss, data) {
  var codes = data.codes;
  if (!codes || !Array.isArray(codes) || codes.length === 0) {
    return jsonResponse({ success: true, tokens: {} });
  }

  var sheet = getOrCreateSheet(ss, ADVISOR_SHEET_NAME, ADVISOR_HEADERS);
  if (sheet.getLastRow() < 2) {
    return jsonResponse({ success: true, tokens: {} });
  }

  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
  var codeSet = {};
  for (var i = 0; i < codes.length; i++) codeSet[codes[i]] = true;

  var now = new Date();
  var tokens = {};
  for (var i = 0; i < rows.length; i++) {
    var code = rows[i][1];
    if (!codeSet[code]) continue;

    var sheetStatus = rows[i][5] || '';
    var sheetType = rows[i][4] || '';
    var endDate = rows[i][7] ? new Date(rows[i][7]) : null;

    // 6ヶ月契約: 終了日超過 → 自動的に権利終了
    if (sheetStatus === 'セッション中' && SIX_MONTH_TYPES[sheetType] && endDate && now > endDate) {
      sheet.getRange(i + 2, 6).setValue('権利終了');
      sheetStatus = '権利終了';
    }

    var apiStatus = STATUS_MAP[sheetStatus] || 'activated';
    var apiType = TYPE_MAP[sheetType] || 'spot';
    var startDate = rows[i][6] ? new Date(rows[i][6]).toISOString() : null;

    tokens[code] = {
      status: apiStatus,
      startDate: startDate,
      type: apiType
    };
  }

  return jsonResponse({ success: true, tokens: tokens });
}

/**
 * advisor_start_session — セッション開始記録（オペレーター用）
 *
 * POST { type: "advisor_start_session", code: "TOKI-XXXX-...", operator_key: "..." }
 * → { success: true, startDate: "2026-04-15T..." }
 */
function handleAdvisorStartSession(ss, data) {
  var operatorKey = _props.getProperty('ADVISOR_OPERATOR_KEY') || '';
  if (!operatorKey || data.operator_key !== operatorKey) {
    return jsonResponse({ success: false, error: 'unauthorized' });
  }

  var code = (data.code || '').trim().toUpperCase();
  if (!/^TOKI-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
    return jsonResponse({ success: false, error: 'invalid_code' });
  }

  var sheet = getOrCreateSheet(ss, ADVISOR_SHEET_NAME, ADVISOR_HEADERS);
  if (sheet.getLastRow() < 2) {
    return jsonResponse({ success: false, error: 'not_found' });
  }

  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][1] !== code) continue;

    var currentStatus = rows[i][5] || '';
    if (currentStatus !== '入金確認済み') {
      return jsonResponse({ success: false, error: 'invalid_status', current: STATUS_MAP[currentStatus] || currentStatus });
    }

    var now = new Date();
    var sheetType = rows[i][4] || '';
    var rowIdx = i + 2;

    // ステータス → セッション中
    sheet.getRange(rowIdx, 6).setValue('セッション中');
    // 開始日
    sheet.getRange(rowIdx, 7).setValue(now);

    // 6ヶ月契約: 終了日 = 開始日 + 6ヶ月
    if (SIX_MONTH_TYPES[sheetType]) {
      var endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 6);
      sheet.getRange(rowIdx, 8).setValue(endDate);
    }

    // スポット: セッション開始 = 実施済
    if (sheetType === 'SpotConsultation') {
      sheet.getRange(rowIdx, 6).setValue('実施済');
    }

    // メール通知
    sendEmail(NOTIFY_EMAIL,
      '【TokiStorage】セッション開始 — ' + code,
      'サービスのセッションが開始されました。\n\n'
      + 'コード: ' + code + '\n'
      + 'タイプ: ' + sheetType + '\n'
      + '開始日: ' + now.toISOString() + '\n');

    return jsonResponse({ success: true, startDate: now.toISOString() });
  }

  return jsonResponse({ success: false, error: 'not_found' });
}

/**
 * advisor_complete — スポット完了 / 顧問契約終了（オペレーター用）
 *
 * POST { type: "advisor_complete", code: "TOKI-XXXX-...", operator_key: "..." }
 * → { success: true }
 */
function handleAdvisorComplete(ss, data) {
  var operatorKey = _props.getProperty('ADVISOR_OPERATOR_KEY') || '';
  if (!operatorKey || data.operator_key !== operatorKey) {
    return jsonResponse({ success: false, error: 'unauthorized' });
  }

  var code = (data.code || '').trim().toUpperCase();
  if (!/^TOKI-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
    return jsonResponse({ success: false, error: 'invalid_code' });
  }

  var sheet = getOrCreateSheet(ss, ADVISOR_SHEET_NAME, ADVISOR_HEADERS);
  if (sheet.getLastRow() < 2) {
    return jsonResponse({ success: false, error: 'not_found' });
  }

  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][1] !== code) continue;

    var currentStatus = rows[i][5] || '';
    var sheetType = rows[i][4] || '';
    var rowIdx = i + 2;

    if (sheetType === 'SpotConsultation') {
      sheet.getRange(rowIdx, 6).setValue('実施済');
    } else {
      // 6ヶ月契約: 権利終了
      sheet.getRange(rowIdx, 6).setValue('権利終了');
      if (!rows[i][7]) {
        sheet.getRange(rowIdx, 8).setValue(new Date());
      }
    }

    return jsonResponse({ success: true });
  }

  return jsonResponse({ success: false, error: 'not_found' });
}

// ── スプレッドシート カスタムメニュー ──

function onOpen() {
  SpreadsheetApp.getUi().createMenu('アドバイザー管理')
    .addItem('セッション開始', 'showStartSessionDialog')
    .addItem('完了 / 権利終了', 'showCompleteDialog')
    .addToUi();
}

function showStartSessionDialog() {
  var html = HtmlService.createHtmlOutput(
    '<style>'
    + 'body{font-family:sans-serif;padding:16px}'
    + 'input{width:100%;padding:8px;font-size:14px;margin:8px 0;box-sizing:border-box}'
    + 'button{padding:8px 20px;font-size:14px;cursor:pointer;background:#2563EB;color:#fff;border:none;border-radius:4px}'
    + 'button:hover{background:#1D4ED8}'
    + '#result{margin-top:12px;padding:8px;font-size:13px}'
    + '.ok{color:#065F46;background:#D1FAE5;border-radius:4px}'
    + '.err{color:#991B1B;background:#FEE2E2;border-radius:4px}'
    + '</style>'
    + '<p>トークンコードを入力してセッションを開始します。<br>'
    + 'スポット → 即「実施済」<br>顧問契約 → 「セッション中」+ 6ヶ月期間設定</p>'
    + '<input id="code" placeholder="TOKI-XXXX-XXXX-XXXX">'
    + '<button onclick="run()">セッション開始</button>'
    + '<div id="result"></div>'
    + '<script>'
    + 'function run(){'
    + '  var code=document.getElementById("code").value.trim().toUpperCase();'
    + '  if(!code){return}'
    + '  document.getElementById("result").className="";'
    + '  document.getElementById("result").textContent="処理中...";'
    + '  google.script.run'
    + '    .withSuccessHandler(function(r){'
    + '      document.getElementById("result").className="ok";'
    + '      document.getElementById("result").textContent=r;'
    + '    })'
    + '    .withFailureHandler(function(e){'
    + '      document.getElementById("result").className="err";'
    + '      document.getElementById("result").textContent=e.message;'
    + '    })'
    + '    .menuStartSession(code);'
    + '}'
    + '</script>'
  ).setWidth(400).setHeight(280).setTitle('セッション開始');
  SpreadsheetApp.getUi().showModalDialog(html, 'セッション開始');
}

function showCompleteDialog() {
  var html = HtmlService.createHtmlOutput(
    '<style>'
    + 'body{font-family:sans-serif;padding:16px}'
    + 'input{width:100%;padding:8px;font-size:14px;margin:8px 0;box-sizing:border-box}'
    + 'button{padding:8px 20px;font-size:14px;cursor:pointer;background:#DC2626;color:#fff;border:none;border-radius:4px}'
    + 'button:hover{background:#B91C1C}'
    + '#result{margin-top:12px;padding:8px;font-size:13px}'
    + '.ok{color:#065F46;background:#D1FAE5;border-radius:4px}'
    + '.err{color:#991B1B;background:#FEE2E2;border-radius:4px}'
    + '</style>'
    + '<p>トークンコードを入力して完了処理を行います。<br>'
    + 'スポット → 「実施済」<br>顧問契約 → 「権利終了」</p>'
    + '<input id="code" placeholder="TOKI-XXXX-XXXX-XXXX">'
    + '<button onclick="run()">完了 / 権利終了</button>'
    + '<div id="result"></div>'
    + '<script>'
    + 'function run(){'
    + '  var code=document.getElementById("code").value.trim().toUpperCase();'
    + '  if(!code){return}'
    + '  document.getElementById("result").className="";'
    + '  document.getElementById("result").textContent="処理中...";'
    + '  google.script.run'
    + '    .withSuccessHandler(function(r){'
    + '      document.getElementById("result").className="ok";'
    + '      document.getElementById("result").textContent=r;'
    + '    })'
    + '    .withFailureHandler(function(e){'
    + '      document.getElementById("result").className="err";'
    + '      document.getElementById("result").textContent=e.message;'
    + '    })'
    + '    .menuCompleteSession(code);'
    + '}'
    + '</script>'
  ).setWidth(400).setHeight(260).setTitle('完了 / 権利終了');
  SpreadsheetApp.getUi().showModalDialog(html, '完了 / 権利終了');
}

function menuStartSession(code) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = getOrCreateSheet(ss, ADVISOR_SHEET_NAME, ADVISOR_HEADERS);
  if (sheet.getLastRow() < 2) throw new Error('該当コードが見つかりません');

  code = code.trim().toUpperCase();
  if (!/^TOKI-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
    throw new Error('コード形式が不正です');
  }

  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][1] !== code) continue;

    var currentStatus = rows[i][5] || '';
    if (currentStatus !== '入金確認済み') {
      throw new Error('ステータスが「入金確認済み」ではありません（現在: ' + currentStatus + '）');
    }

    var now = new Date();
    var sheetType = rows[i][4] || '';
    var rowIdx = i + 2;

    sheet.getRange(rowIdx, 6).setValue('セッション中');
    sheet.getRange(rowIdx, 7).setValue(now);

    if (SIX_MONTH_TYPES[sheetType]) {
      var endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + 6);
      sheet.getRange(rowIdx, 8).setValue(endDate);
    }

    if (sheetType === 'SpotConsultation') {
      sheet.getRange(rowIdx, 6).setValue('実施済');
      return 'スポット「' + code + '」→ 実施済（' + now.toLocaleDateString('ja-JP') + '）';
    }

    var typeName = TYPE_MAP[sheetType] || sheetType;
    return typeName + '「' + code + '」→ セッション中（' + now.toLocaleDateString('ja-JP') + ' 〜 6ヶ月間）';
  }

  throw new Error('コード「' + code + '」が見つかりません');
}

function menuCompleteSession(code) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = getOrCreateSheet(ss, ADVISOR_SHEET_NAME, ADVISOR_HEADERS);
  if (sheet.getLastRow() < 2) throw new Error('該当コードが見つかりません');

  code = code.trim().toUpperCase();
  if (!/^TOKI-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
    throw new Error('コード形式が不正です');
  }

  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][1] !== code) continue;

    var sheetType = rows[i][4] || '';
    var rowIdx = i + 2;

    if (sheetType === 'SpotConsultation') {
      sheet.getRange(rowIdx, 6).setValue('実施済');
      return 'スポット「' + code + '」→ 実施済';
    } else {
      sheet.getRange(rowIdx, 6).setValue('権利終了');
      if (!rows[i][7]) {
        sheet.getRange(rowIdx, 8).setValue(new Date());
      }
      var typeName = TYPE_MAP[sheetType] || sheetType;
      return typeName + '「' + code + '」→ 権利終了';
    }
  }

  throw new Error('コード「' + code + '」が見つかりません');
}

// ── 日次トリガー: 顧問契約の自動期限切れ ──

function checkExpiredAdvisors() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = getOrCreateSheet(ss, ADVISOR_SHEET_NAME, ADVISOR_HEADERS);
  if (sheet.getLastRow() < 2) return;

  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
  var now = new Date();
  var expired = [];

  for (var i = 0; i < rows.length; i++) {
    var status = rows[i][5] || '';
    var type = rows[i][4] || '';
    var endDate = rows[i][7] ? new Date(rows[i][7]) : null;

    if (status === 'セッション中' && SIX_MONTH_TYPES[type] && endDate && now > endDate) {
      sheet.getRange(i + 2, 6).setValue('権利終了');
      expired.push(rows[i][1]);
    }
  }

  if (expired.length > 0) {
    sendEmail(NOTIFY_EMAIL,
      '【TokiStorage】サービスの権利終了（自動）',
      '以下のサービスが期間満了により権利終了になりました。\n\n'
      + expired.join('\n') + '\n\n'
      + 'スプレッドシートで確認してください。');
  }
}
