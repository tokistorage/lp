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
