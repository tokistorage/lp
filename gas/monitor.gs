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
  // 年ファイル + インデックスを qr リポジトリの main に直接コミット（排他制御）
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var now = new Date();
    var year = now.getFullYear();
    var dateStr = year + '-'
      + ('0' + (now.getMonth() + 1)).slice(-2) + '-'
      + ('0' + now.getDate()).slice(-2);
    var newVoice = {
      wisetag: (data.wisetag || '').toString(),
      date: dateStr,
      comment: (data.comment || '').toString().trim()
    };

    // 年ファイルに追記
    var yearPath = 'monitor/voices/' + year + '.json';
    var existing = readFileFromGitHub(yearPath, GITHUB_REPO_QR);
    var voices = [];
    if (existing) {
      try { voices = JSON.parse(existing); } catch (e) { voices = []; }
    }
    voices.unshift(newVoice);

    commitFileOnBranch(
      yearPath,
      JSON.stringify(voices, null, 2) + '\n',
      'Add monitor voice: ' + (data.wisetag || ''),
      'main',
      GITHUB_REPO_QR
    );

    // インデックス更新
    var indexPath = 'monitor/voices/index.json';
    var indexRaw = readFileFromGitHub(indexPath, GITHUB_REPO_QR);
    var index = [];
    if (indexRaw) {
      try { index = JSON.parse(indexRaw); } catch (e) { index = []; }
    }
    var found = false;
    for (var i = 0; i < index.length; i++) {
      if (index[i].year === year) {
        index[i].count = voices.length;
        found = true;
        break;
      }
    }
    if (!found) {
      index.push({ year: year, count: voices.length });
    }
    index.sort(function(a, b) { return b.year - a.year; });

    commitFileOnBranch(
      indexPath,
      JSON.stringify(index, null, 2) + '\n',
      'Update voices index',
      'main',
      GITHUB_REPO_QR
    );
  } catch (ghErr) {
    Logger.log('voices commit failed: ' + ghErr.toString());
  } finally {
    lock.releaseLock();
  }

  return jsonResponse({ success: true });
}
