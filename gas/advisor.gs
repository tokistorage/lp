/**
 * タイムレスアドバイザー — トークンライフサイクル (advisor.gs)
 *
 * シートヘッダー:
 *   '日時', 'コード', '金額', '通貨', 'タイプ', 'ステータス', '開始日', '終了日'
 *
 * ステータス遷移:
 *   入金確認済み (activated) → セッション中 (active) → 実施済 (completed) / 権利終了 (expired)
 *
 * タイプ:
 *   SpotConsultation → spot
 *   Retainer-6mo    → annual
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
  'Retainer-6mo': 'annual'
};

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

  var sheet = ss.getSheetByName(ADVISOR_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) {
    return jsonResponse({ success: true, tokens: {} });
  }

  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
  var codeSet = {};
  for (var i = 0; i < codes.length; i++) codeSet[codes[i]] = true;

  var tokens = {};
  for (var i = 0; i < rows.length; i++) {
    var code = rows[i][1];
    if (!codeSet[code]) continue;

    var sheetStatus = rows[i][5] || '';
    var apiStatus = STATUS_MAP[sheetStatus] || 'activated';
    var sheetType = rows[i][4] || '';
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

  var sheet = ss.getSheetByName(ADVISOR_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) {
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

    // 顧問契約: 終了日 = 開始日 + 6ヶ月
    if (sheetType === 'Retainer-6mo') {
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
      '【TimelessAdvisor】セッション開始 — ' + code,
      'タイムレスアドバイザーのセッションが開始されました。\n\n'
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

  var sheet = ss.getSheetByName(ADVISOR_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) {
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
      // 顧問契約: 権利終了
      sheet.getRange(rowIdx, 6).setValue('権利終了');
      if (!rows[i][7]) {
        sheet.getRange(rowIdx, 8).setValue(new Date());
      }
    }

    return jsonResponse({ success: true });
  }

  return jsonResponse({ success: false, error: 'not_found' });
}
