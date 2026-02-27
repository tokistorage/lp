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

  return jsonResponse({ success: true });
}

// ── モニターフィードバック ──

var VOICES_ARCHIVE_THRESHOLD = 1000;
var VOICES_ARCHIVE_SIZE = 500;

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

    // インデックス読み取り
    var indexPath = 'monitor/voices/index.json';
    var indexRaw = readFileFromGitHub(indexPath, GITHUB_REPO_QR);
    var index = [];
    if (indexRaw) {
      try { index = JSON.parse(indexRaw); } catch (e) { index = []; }
    }

    // 年エントリを取得または作成
    var entry = null;
    for (var i = 0; i < index.length; i++) {
      if (index[i].year === year) { entry = index[i]; break; }
    }
    if (!entry) {
      entry = { year: year, count: 0 };
      index.push(entry);
    }

    // 退避チェック: 1000件超なら古い500件をアーカイブ
    if (voices.length > VOICES_ARCHIVE_THRESHOLD) {
      var archiveVoices = voices.splice(-VOICES_ARCHIVE_SIZE);
      var nextNum = (entry.archives || 0) + 1;
      var archiveName = year + '-' + ('000' + nextNum).slice(-3);

      commitFileOnBranch(
        'monitor/voices/' + archiveName + '.json',
        JSON.stringify(archiveVoices, null, 2) + '\n',
        'Archive voices: ' + archiveName,
        'main',
        GITHUB_REPO_QR
      );

      entry.archives = nextNum;
    }

    // 年ファイルコミット
    commitFileOnBranch(
      yearPath,
      JSON.stringify(voices, null, 2) + '\n',
      'Add monitor voice: ' + (data.wisetag || ''),
      'main',
      GITHUB_REPO_QR
    );

    // インデックス更新
    entry.count = voices.length + (entry.archives || 0) * VOICES_ARCHIVE_SIZE;
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
