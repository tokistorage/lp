/**
 * ニュースレター自動更新 (newsletter.gs)
 *
 * 6ヶ月サイクルのニュースレター自動進行ロジック。
 * advanceNewsletterIssue() を毎日タイマーで実行。
 */

var MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * ニュースレター号数を自動進行
 * 毎日 9:00 JST にタイマーで実行
 *
 * スケジュール:
 *   - 発行月の1日: ステータスを 'published' に変更
 *   - 発行月の翌月1日: 次号を 'drafting' に変更、新号を準備
 *   - CURRENT_NEWSLETTER_ISSUE を自動更新
 */
function advanceNewsletterIssue() {
  var scheduleJson = readFileFromGitHub('newsletter/schedule.json');
  if (!scheduleJson) return;
  var schedule = JSON.parse(scheduleJson);
  var issues = schedule.issues || [];
  if (issues.length === 0) return;

  var now = new Date();
  var jstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  var currentYear = jstNow.getUTCFullYear();
  var currentMonth = jstNow.getUTCMonth() + 1;
  var currentDay = jstNow.getUTCDate();
  var currentYM = currentYear + '-' + ('0' + currentMonth).slice(-2);

  var changed = false;
  var latestIssue = issues[issues.length - 1];

  // 発行月の1日: published に変更
  for (var i = 0; i < issues.length; i++) {
    var issue = issues[i];
    if (issue.status === 'drafting') {
      var issueYM = issue.year + '-' + ('0' + issue.month).slice(-2);
      if (issueYM <= currentYM && currentDay >= 1) {
        issue.status = 'published';
        changed = true;

        sendEmail(NOTIFY_EMAIL,
          '【ニュースレター】第' + issue.serial + '号 発行',
          '第' + issue.serial + '号（' + issue.title_ja + '）のステータスを published に変更しました。\n\n'
          + 'ボリューム: ' + issue.volume + '\n'
          + '号: ' + issue.number + '\n'
          + '通巻: ' + issue.serial);
      }
    }
  }

  // 最新号が published なら次号を準備
  if (latestIssue.status === 'published') {
    var nextMonth = latestIssue.month + 6;
    var nextYear = latestIssue.year;
    if (nextMonth > 12) {
      nextMonth -= 12;
      nextYear++;
    }

    var nextSerial = latestIssue.serial + 1;
    var nextVolume = latestIssue.volume;
    var nextNumber = latestIssue.number + 1;

    // ボリューム境界チェック（6ヶ月×2 = 年2号、20年で40号 = 1ボリューム）
    var volumeInfo = schedule.volumes || {};
    var currentVolumeConfig = volumeInfo[String(nextVolume)];
    if (currentVolumeConfig && currentVolumeConfig.max_issues && nextNumber > currentVolumeConfig.max_issues) {
      nextVolume++;
      nextNumber = 1;

      // 新ボリュームのアーカイブリポジトリを準備
      try {
        provisionArchiveRepo(schedule, nextVolume);
      } catch (e) {
        sendEmail(NOTIFY_EMAIL,
          '【ニュースレター】新ボリューム準備エラー',
          'ボリューム ' + nextVolume + ' の準備中にエラーが発生しました。\n' + e.message);
      }
    }

    var nextYM = nextYear + '-' + ('0' + nextMonth).slice(-2);
    var nextIssue = {
      year: nextYear,
      month: nextMonth,
      volume: nextVolume,
      number: nextNumber,
      serial: nextSerial,
      status: 'drafting',
      title_ja: '第' + nextSerial + '号',
      title_en: 'No. ' + nextSerial
    };
    issues.push(nextIssue);
    changed = true;

    // CURRENT_NEWSLETTER_ISSUE を更新
    PropertiesService.getScriptProperties().setProperty('CURRENT_NEWSLETTER_ISSUE', nextYM);

    sendEmail(NOTIFY_EMAIL,
      '【ニュースレター】第' + nextSerial + '号 準備開始',
      '次号を準備しました。\n\n'
      + '発行予定: ' + nextYM + '\n'
      + 'ボリューム: ' + nextVolume + '\n'
      + '号: ' + nextNumber + '\n'
      + '通巻: ' + nextSerial);

    // ニュースレター素材マニフェストを初期化
    try {
      var emptyManifest = {
        issue: nextIssue,
        essays: [],
        materials: [],
        lastUpdated: new Date().toISOString()
      };
      pushFileToGitHub('newsletter/materials/' + nextYM + '/manifest.json',
        JSON.stringify(emptyManifest, null, 2),
        'Initialize materials manifest for issue ' + nextSerial);
    } catch (e) {}

    // エッセイ自動選定
    try {
      selectEssaysForIssue(nextIssue);
    } catch (e) {}
  }

  // 前号のバッジを更新（previous）
  if (changed && issues.length >= 2) {
    var prev = issues[issues.length - 2];
    if (prev.status === 'published') {
      try {
        updatePreviousBadge(prev);
      } catch (e) {}
    }
  }

  if (changed) {
    schedule.issues = issues;
    pushFileToGitHub('newsletter/schedule.json',
      JSON.stringify(schedule, null, 2),
      'Advance newsletter schedule');
  }
}

/**
 * 新ボリューム用のアーカイブリポジトリを準備
 */
function provisionArchiveRepo(schedule, volumeNum) {
  var repoName = 'newsletter-vol' + volumeNum;
  var repo = 'tokistorage/' + repoName;

  fetchGitHubApi('/user/repos', 'POST', {
    name: repoName,
    description: 'TokiStorage Newsletter Volume ' + volumeNum + ' Archive',
    homepage: 'https://tokistorage.github.io/' + repoName + '/',
    'private': false,
    has_issues: false,
    has_projects: false,
    has_wiki: false,
    auto_init: true
  });

  Utilities.sleep(3000);

  // index.html テンプレート
  var templateIndex = readFileFromGitHub('newsletter/archive-template/index.html');
  if (templateIndex) {
    templateIndex = templateIndex.replace(/\{\{VOLUME\}\}/g, String(volumeNum));
    commitFileOnBranch('index.html', templateIndex,
      'Add archive index for volume ' + volumeNum, 'main', repo);
  }

  // auto-merge workflow
  var autoMerge = 'name: Auto Merge\n\n'
    + 'on:\n'
    + '  pull_request:\n'
    + '    types: [opened]\n\n'
    + 'permissions:\n'
    + '  contents: write\n'
    + '  pull-requests: write\n\n'
    + 'jobs:\n'
    + '  auto-merge:\n'
    + '    runs-on: ubuntu-latest\n'
    + '    steps:\n'
    + '      - run: gh pr merge ${{ github.event.pull_request.number }} --merge --delete-branch\n'
    + '        env:\n'
    + '          GH_TOKEN: ${{ github.token }}\n'
    + '          GH_REPO: ${{ github.repository }}\n';
  commitFileOnBranch('.github/workflows/auto-merge.yml', autoMerge,
    'Add auto-merge workflow', 'main', repo);

  // GitHub Pages 有効化
  try {
    fetchGitHubApi('/repos/' + repo + '/pages', 'POST', {
      source: { branch: 'main', path: '/' }
    });
  } catch (e) {}

  // schedule.json にボリューム情報を追加
  if (!schedule.volumes) schedule.volumes = {};
  schedule.volumes[String(volumeNum)] = {
    repo: repo,
    pages_url: 'https://tokistorage.github.io/' + repoName + '/',
    max_issues: 40,
    created: new Date().toISOString()
  };

  sendEmail(NOTIFY_EMAIL,
    '【ニュースレター】新ボリューム ' + volumeNum + ' 準備完了',
    'リポジトリ: https://github.com/' + repo + '\n'
    + 'Pages: https://tokistorage.github.io/' + repoName + '/');
}

/**
 * 前号のバッジを "previous" に更新
 */
function updatePreviousBadge(issue) {
  var volumeInfo = getCurrentVolumeInfo();
  var badgePath = 'newsletter/badges/issue-' + issue.serial + '.json';
  var badge = {
    schemaVersion: 1,
    label: 'newsletter',
    message: '第' + issue.serial + '号',
    color: 'blue',
    namedLogo: 'read-the-docs',
    style: 'flat-square'
  };
  pushFileToGitHub(badgePath, JSON.stringify(badge, null, 2),
    'Update badge for issue ' + issue.serial + ' (previous)');
}

/**
 * 次号に掲載するエッセイを自動選定
 */
function selectEssaysForIssue(nextIssue) {
  // essay-nav.js から最新エッセイIDを取得
  var navJs = readFileFromGitHub('essay-nav.js');
  if (!navJs) return;

  var latestMatch = navJs.match(/latestEssayIds\s*=\s*\[([^\]]+)\]/);
  if (!latestMatch) return;

  var idsStr = latestMatch[1];
  var ids = idsStr.split(',').map(function(s) { return s.trim().replace(/['"]/g, ''); }).filter(function(s) { return s; });

  // 最新3本をニュースレター候補に
  var selected = ids.slice(0, 3);

  var manifestPath = 'newsletter/materials/' + nextIssue.year + '-' + ('0' + nextIssue.month).slice(-2) + '/manifest.json';
  var manifestJson = readFileFromGitHub(manifestPath);
  if (!manifestJson) return;
  var manifest = JSON.parse(manifestJson);

  manifest.essays = selected.map(function(id) {
    return { id: id, status: 'candidate' };
  });
  manifest.lastUpdated = new Date().toISOString();

  pushFileToGitHub(manifestPath, JSON.stringify(manifest, null, 2),
    'Add essay candidates for issue ' + nextIssue.serial);
}
