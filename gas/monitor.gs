// ── モニター申し込み ──

function handleMonitorApply(ss, data) {
  var sheet = getOrCreateSheet(ss, 'モニター申し込み', ['日時', 'Wisetag', 'デバイス', '言語', 'UA']);
  sheet.insertRowAfter(1);
  sheet.getRange(2, 1, 1, 5).setValues([[
    new Date(),
    data.wisetag || '',
    data.device || '',
    data.lang || '',
    (data.ua || '').substring(0, 500)
  ]]);

  sendEmail(NOTIFY_EMAIL,
    '【モニター申し込み】' + (data.wisetag || ''),
    'Wisetag: ' + (data.wisetag || '') + '\n'
    + 'デバイス: ' + (data.device || '') + '\n'
    + '言語: ' + (data.lang || '') + '\n'
    + '日時: ' + new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
  );

  return jsonResponse({ success: true });
}

// ── モニターフィードバック ──

function handleMonitorFeedback(ss, data) {
  var sheet = getOrCreateSheet(ss, 'モニターフィードバック', ['日時', 'Wisetag', 'コメント', 'デバイス', '言語', 'UA']);
  sheet.insertRowAfter(1);
  sheet.getRange(2, 1, 1, 6).setValues([[
    new Date(),
    data.wisetag || '',
    data.comment || '',
    data.device || '',
    data.lang || '',
    (data.ua || '').substring(0, 500)
  ]]);

  sendEmail(NOTIFY_EMAIL,
    '【モニターフィードバック】' + (data.wisetag || ''),
    'Wisetag: ' + (data.wisetag || '') + '\n'
    + 'コメント:\n' + (data.comment || '') + '\n\n'
    + 'デバイス: ' + (data.device || '') + '\n'
    + '言語: ' + (data.lang || '') + '\n'
    + '日時: ' + new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
  );

  return jsonResponse({ success: true });
}

// ── モニターの声（公開一覧）──

function handleMonitorVoices(ss) {
  var sheet = ss.getSheetByName('モニターフィードバック');
  if (!sheet || sheet.getLastRow() < 2) {
    return jsonResponse({ success: true, voices: [] });
  }

  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues(); // 日時, Wisetag, コメント
  var voices = [];
  for (var i = 0; i < data.length; i++) {
    var comment = (data[i][2] || '').toString().trim();
    if (!comment) continue;
    var d = data[i][0];
    var dateStr = d instanceof Date
      ? d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2)
      : '';
    voices.push({
      wisetag: (data[i][1] || '').toString(),
      date: dateStr,
      comment: comment
    });
  }

  // 新しい順（シートがinsertRowAfterで上に追加されるのでそのまま）
  return jsonResponse({ success: true, voices: voices });
}
