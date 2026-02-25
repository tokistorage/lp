/**
 * クレジットコード — マルチQR + 特集権 (credits.gs)
 *
 * シートヘッダー（v3）:
 *   '日時', 'コード', '数量', 'タイプ', '注文番号', 'メールアドレス', 'ステータス', '使用日時'
 *
 * タイプ: 'multiQR' | 'tokushu'
 */

function generateCreditCode(ss, count, contact, orderId, type) {
  type = type || 'multiQR';
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function rand4() {
    var s = '';
    for (var i = 0; i < 4; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
    return s;
  }
  var code = 'TOKI-' + rand4() + '-' + rand4() + '-' + rand4();
  var sheet = getOrCreateSheet(ss, CREDIT_SHEET_NAME, [
    '日時', 'コード', '数量', 'タイプ', '注文番号', 'メールアドレス', 'ステータス', '使用日時'
  ]);
  sheet.appendRow([
    new Date(), code, count, type, orderId || '', contact || '', '未使用', ''
  ]);
  return code;
}

function createTestCreditCode() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var code = generateCreditCode(ss, 1, '', 'TEST', 'multiQR');
  Logger.log('テストコード: ' + code + ' (1 multiQR)');
}

function createTestTokushuCode() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var code = generateCreditCode(ss, 1, '', 'TEST', 'tokushu');
  Logger.log('テストコード: ' + code + ' (1 tokushu)');
}

function registerCreditCode(ss, code, count, type) {
  type = type || 'multiQR';
  var sheet = getOrCreateSheet(ss, CREDIT_SHEET_NAME, [
    '日時', 'コード', '数量', 'タイプ', '注文番号', 'メールアドレス', 'ステータス', '使用日時'
  ]);
  if (sheet.getLastRow() >= 2) {
    var rows = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < rows.length; i++) {
      if (rows[i][0] === code) return;
    }
  }
  sheet.appendRow([
    new Date(), code, count, type, 'codeless', '', '未使用', ''
  ]);
}

function handleCreditActivation(ss, data) {
  var code = (data.code || '').trim().toUpperCase();
  if (!/^TOKI-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) {
    return jsonResponse({ success: false, error: 'invalid_code' });
  }

  var sheet = ss.getSheetByName(CREDIT_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) {
    return jsonResponse({ success: false, error: 'invalid_code' });
  }

  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][1] === code) {
      if (rows[i][6] === '使用済み') {
        return jsonResponse({ success: false, error: 'already_used' });
      }
      sheet.getRange(i + 2, 7).setValue('使用済み');
      sheet.getRange(i + 2, 8).setValue(new Date());
      var count = rows[i][2];
      var type = rows[i][3] || 'multiQR';
      if (type === 'tokushu') {
        return jsonResponse({ success: true, tokushu: count });
      } else {
        return jsonResponse({ success: true, credits: count });
      }
    }
  }

  return jsonResponse({ success: false, error: 'invalid_code' });
}
