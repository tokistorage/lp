/**
 * NDL特集シリーズ — series_open / ndl_submit (ndl.gs)
 *
 * v4 変更点 (v3からの移行):
 *   - GAS内PDF生成 → materials JSONコミット + GitHub Actions PDF生成
 *   - generateTokiqrNewsletter() 削除 → build-newsletter.yml に移行
 *   - schedule.json status: 'published' → 'building'（Actionsが'published'に更新）
 *
 * フロー:
 *   GAS → materials/{serial}.json コミット → auto-merge
 *   → build-newsletter.yml → PDF生成 → PR → auto-merge → Pages公開
 *
 * タイマートリガー設定:
 *   - sendMonthlySeriesReport() → 毎月1日 9:00（アクティビティレポート）
 */

// =====================================================
// NDL Newsletter Publishing — Actions Pipeline (v4)
// =====================================================

var SERIES_SHEET_NAME = '特集シリーズ';
var SERIES_SHEET_HEADERS = [
  '日時', 'シリーズ名', 'クライアントID', 'リポジトリ', 'ステータス',
  '発行数', '作成日', '備考'
];

// ── シリーズ管理 ──

/**
 * 特集シリーズ一覧を取得
 */
function getSeriesList() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SERIES_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return [];
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 8).getValues();
  return data.filter(function(r) { return r[1]; }).map(function(r) {
    return {
      date: r[0],
      seriesName: r[1],
      clientId: r[2],
      repo: r[3],
      status: r[4],
      issueCount: r[5],
      createdAt: r[6],
      note: r[7]
    };
  });
}

/**
 * シリーズ名からアクティブなシリーズを検索
 */
function findSeries(seriesName) {
  if (!seriesName) return null;
  var list = getSeriesList();
  for (var i = 0; i < list.length; i++) {
    if (list[i].seriesName === seriesName && list[i].status === 'active') {
      return list[i];
    }
  }
  return null;
}

/**
 * シリーズ名からクライアントIDを生成
 * ハッシュ + タイムスタンプで一意性を確保
 */
function generateClientId(seriesName) {
  var hash = 0;
  for (var i = 0; i < seriesName.length; i++) {
    hash = ((hash << 5) - hash) + seriesName.charCodeAt(i);
    hash |= 0;
  }
  var ts = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMddHHmm');
  return 'ts-' + Math.abs(hash).toString(36) + '-' + ts;
}

/**
 * シリーズの発行数を更新
 */
function updateSeriesIssueCount(ss, seriesName, count) {
  var sheet = ss.getSheetByName(SERIES_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return;
  var rows = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][0] === seriesName) {
      sheet.getRange(i + 2, 6).setValue(count); // 発行数列
      return;
    }
  }
}

// ── 通巻番号計算 ──

/**
 * 通巻番号からボリューム・号を計算（式年遷宮型: 1巻 = 20年）
 */
function calcVolumeNumber(serial, startYear, durationYears) {
  var now = new Date();
  var currentYear = parseInt(Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy'));
  var volume = Math.floor((currentYear - startYear) / durationYears) + 1;
  return { volume: volume, number: serial };
}

// ── エンドポイント: series_open ──

/**
 * 特集シリーズ開設
 *
 * リクエスト:
 *   { type: 'series_open', seriesName: '佐藤家族' }
 *
 * レスポンス:
 *   { success: true, repo: 'tokistorage/newsletter-client-ts-xxx',
 *     pagesUrl: 'https://tokistorage.github.io/newsletter-client-ts-xxx/' }
 *
 * 処理:
 *   1. 同名シリーズが存在すれば既存情報を返す
 *   2. なければ client-config.json を組み立て
 *   3. provisionClientRepo() でリポジトリ作成
 *   4. シリーズシートに記録
 *   5. 管理者通知
 */
function handleSeriesOpen(ss, data) {
  var seriesName = (data.seriesName || '').trim();
  if (!seriesName) {
    return jsonResponse({ success: false, error: 'missing_series_name' });
  }

  // 既存シリーズチェック（冪等性: 同名で再呼び出しされても安全）
  var existing = findSeries(seriesName);
  if (existing) {
    var existingRepoName = existing.repo.split('/')[1] || existing.repo;
    return jsonResponse({
      success: true,
      repo: existing.repo,
      pagesUrl: 'https://tokistorage.github.io/' + existingRepoName + '/',
      note: 'already_exists'
    });
  }

  var clientId = generateClientId(seriesName);
  var startYear = parseInt(Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy'));

  var config = {
    clientId: clientId,
    clientName: seriesName,
    branding: {
      accentColor: [37, 99, 235],
      publicationNameJa: seriesName + ' 特集',
      publicationNameEn: seriesName + ' Special Feature',
      tagline: '── ' + seriesName + ' ──'
    },
    colophon: {
      publisher: 'TokiStorage（佐藤卓也）',
      publisherAddress: '〒279-0014 千葉県浦安市明海2-11-13',
      contentOriginator: seriesName,
      legalBasis: '国立国会図書館法 第25条・第25条の4',
      note: '本誌は TokiStorage が発行者として納本する逐次刊行物です。'
    },
    schedule: {
      volumeDurationYears: 20,
      startYear: startYear
    },
    status: 'active'
  };

  // リポジトリ作成
  var repo = provisionClientRepo(clientId, seriesName, config);
  var repoName = repo.split('/')[1];

  // シリーズシートに記録
  var sheet = getOrCreateSheet(ss, SERIES_SHEET_NAME, SERIES_SHEET_HEADERS);
  sheet.appendRow([
    new Date(), seriesName, clientId, repo, 'active', 0, new Date(), ''
  ]);

  // LP newsletter/series-registry.json に追加
  try {
    updateSeriesRegistry({
      seriesName: seriesName,
      repo: repo,
      pagesUrl: 'https://tokistorage.github.io/' + repoName + '/',
      createdAt: Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd'),
      issueCount: 0,
      status: 'active'
    });
  } catch (e) {
    Logger.log('Registry update failed: ' + e.message);
  }

  // 管理者通知
  sendEmail(NOTIFY_EMAIL,
    '【NDL】新シリーズ開設: ' + seriesName,
    'シリーズ: ' + seriesName + '\n'
    + 'リポジトリ: https://github.com/' + repo + '\n'
    + 'Pages: https://tokistorage.github.io/' + repoName + '/\n');

  return jsonResponse({
    success: true,
    repo: repo,
    pagesUrl: 'https://tokistorage.github.io/' + repoName + '/'
  });
}

// ── エンドポイント: ndl_submit ──

/**
 * NDL献本提出
 *
 * リクエスト:
 *   {
 *     type: 'ndl_submit',
 *     seriesName: '佐藤家族',
 *     title: '結婚式メッセージ',
 *     urls: ['play.html?m=7&c2=...', 'play.html?m=7&c2=...'],
 *     metadata: {
 *       ts: '2026-02-25T10:00:00',
 *       tz: 'Asia/Tokyo',
 *       type: 'audio',
 *       chunkCount: 3
 *     }
 *   }
 *
 * レスポンス:
 *   { success: true, serial: 1 }
 *
 * 処理:
 *   1. シリーズ検索 → クライアントリポジトリ特定
 *   2. schedule.json → 通巻番号インクリメント
 *   3. materials/{serial:05d}.json をブランチにコミット
 *   4. schedule.json を更新・コミット（status: 'building'）
 *   5. PR作成（auto-merge → build-newsletter.yml がPDF生成）
 *   6. シリーズシートの発行数を更新
 *   7. 管理者通知
 */
function handleNdlSubmit(ss, data) {
  var seriesName = (data.seriesName || '').trim();
  if (!seriesName) {
    return jsonResponse({ success: false, error: 'missing_series_name' });
  }

  var series = findSeries(seriesName);
  if (!series) {
    return jsonResponse({ success: false, error: 'series_not_found' });
  }

  var urls = data.urls || [];
  if (urls.length === 0) {
    return jsonResponse({ success: false, error: 'no_urls' });
  }

  // schedule.json 読み込み
  var scheduleJson = readFileFromGitHub('schedule.json', series.repo);
  if (!scheduleJson) {
    return jsonResponse({ success: false, error: 'schedule_not_found' });
  }
  var schedule = JSON.parse(scheduleJson);

  // 通巻番号インクリメント
  var nextSerial = (schedule.current_serial || 0) + 1;
  var startYear = schedule.volume_start_year || 2026;
  var duration = schedule.volume_duration_years || 20;
  var vn = calcVolumeNumber(nextSerial, startYear, duration);

  var serialStr = String(nextSerial).padStart(5, '0');
  var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');

  // materials JSON を組み立て
  var materials = {
    serial: nextSerial,
    volume: vn.volume,
    number: vn.number,
    seriesName: seriesName,
    title: data.title || '',
    urls: urls,
    metadata: data.metadata || {},
    date: today
  };
  var materialsPath = 'materials/' + serialStr + '.json';

  try {
    // ブランチ作成 → materials JSON + schedule.json コミット → PR
    var branch = 'tq-' + serialStr;
    createGitHubBranch(branch, series.repo);

    commitFileOnBranch(materialsPath, JSON.stringify(materials, null, 2),
      'Add materials ' + serialStr, branch, series.repo);

    schedule.current_serial = nextSerial;
    schedule.issues.push({
      date: today,
      serial: nextSerial,
      volume: vn.volume,
      number: vn.number,
      status: 'building',
      title: data.title || '',
      urlCount: urls.length
    });
    commitFileOnBranch('schedule.json', JSON.stringify(schedule, null, 2),
      'Update schedule: TQ-' + serialStr, branch, series.repo);

    createGitHubPR(
      'TQ-' + serialStr + ': ' + (data.title || seriesName),
      branch,
      'NDL serial publication #' + nextSerial + '\n'
      + 'URLs: ' + urls.length + '\n'
      + 'Title: ' + (data.title || '') + '\n\n'
      + 'build-newsletter.yml will generate the PDF after merge.',
      series.repo
    );

    // シリーズシートの発行数を更新
    updateSeriesIssueCount(ss, seriesName, nextSerial);

    // 管理者通知
    var repoName = series.repo.split('/')[1] || series.repo;
    sendEmail(NOTIFY_EMAIL,
      '【NDL】TQ-' + serialStr + ' 投入: ' + (data.title || seriesName),
      'シリーズ: ' + seriesName + '\n'
      + 'タイトル: ' + (data.title || '') + '\n'
      + '通巻: 第' + nextSerial + '号（第' + vn.volume + '巻 第' + vn.number + '号）\n'
      + 'URL数: ' + urls.length + '\n'
      + 'リポジトリ: https://github.com/' + series.repo + '\n'
      + 'ステータス: building（Actions がPDF生成予定）');

    return jsonResponse({
      success: true,
      serial: nextSerial
    });
  } catch (e) {
    sendEmail(NOTIFY_EMAIL,
      '【NDL】投入エラー: ' + seriesName,
      'シリーズ: ' + seriesName + '\n'
      + 'エラー: ' + e.message + '\n'
      + 'スタック: ' + e.stack);
    return jsonResponse({ success: false, error: 'submit_failed', message: e.message });
  }
}

// ── リポジトリプロビジョニング ──

/**
 * クライアントリポジトリを作成
 * newsletter/client-template/ をベースに GitHub リポジトリを自動構築
 *
 * @param {string} clientId - クライアントID (e.g., "ts-abc123-202602251000")
 * @param {string} clientName - 表示名 (e.g., "佐藤家族")
 * @param {object} config - client-config.json の内容
 * @returns {string} リポジトリフルネーム (e.g., "tokistorage/newsletter-client-ts-abc123-202602251000")
 */
function provisionClientRepo(clientId, clientName, config) {
  var repoName = 'newsletter-client-' + clientId;
  var repo = 'tokistorage/' + repoName;

  // 1. リポジトリ作成
  fetchGitHubApi('/user/repos', 'POST', {
    name: repoName,
    description: clientName + ' NDL Newsletter — Published by TokiStorage',
    homepage: 'https://tokistorage.github.io/' + repoName + '/',
    'private': false,
    has_issues: false,
    has_projects: false,
    has_wiki: false,
    auto_init: true
  });

  Utilities.sleep(3000);

  // 2. テンプレートファイルをコミット

  // 2a. client-config.json
  var configJson = JSON.stringify(config, null, 2);
  commitFileOnBranch('client-config.json', configJson,
    'Add client configuration for ' + clientName, 'main', repo);

  // 2b. schedule.json
  var schedule = {
    cadence_months: null,
    volume_start_year: config.schedule ? config.schedule.startYear : 2026,
    volume_duration_years: config.schedule ? config.schedule.volumeDurationYears : 20,
    current_serial: 0,
    issues: []
  };
  commitFileOnBranch('schedule.json', JSON.stringify(schedule, null, 2),
    'Add publication schedule', 'main', repo);

  // 2c. index.html (GitHub Pages archive listing)
  var templateIndex = readFileFromGitHub('newsletter/client-template/index.html');
  if (templateIndex) {
    commitFileOnBranch('index.html', templateIndex,
      'Add archive index page', 'main', repo);
  }

  // 2d. auto-merge workflow
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

  // 2e. materials/.gitkeep (materials JSONの配置先)
  commitFileOnBranch('materials/.gitkeep', '',
    'Add materials directory', 'main', repo);

  // 2f. output/.gitkeep (PDFの配置先)
  commitFileOnBranch('output/.gitkeep', '',
    'Add output directory', 'main', repo);

  // 2g. build-newsletter workflow
  var buildWorkflow = readFileFromGitHub(
    'newsletter/client-template/.github/workflows/build-newsletter.yml');
  if (buildWorkflow) {
    commitFileOnBranch('.github/workflows/build-newsletter.yml', buildWorkflow,
      'Add build-newsletter workflow', 'main', repo);
  }

  // 3. GitHub Pages 有効化
  try {
    fetchGitHubApi('/repos/' + repo + '/pages', 'POST', {
      source: { branch: 'main', path: '/' }
    });
  } catch (e) {
    // Pages が既に有効の場合は無視
  }

  // 4. Actions ワークフロー権限（write + PR作成許可）
  try {
    fetchGitHubApi('/repos/' + repo + '/actions/permissions/workflow', 'PUT', {
      default_workflow_permissions: 'write',
      can_approve_pull_request_reviews: true
    });
  } catch (e) {
    Logger.log('Actions permissions update failed: ' + e.message);
  }

  return repo;
}

// ── シリーズレジストリ更新（LP newsletters.html 用） ──

/**
 * newsletter/series-registry.json を更新
 * LP の newsletters.html が別冊特集セクションを動的表示するためのデータソース
 *
 * @param {Object} entry - { seriesName, repo, pagesUrl, serviceType, createdAt, issueCount, status }
 */
function updateSeriesRegistry(entry) {
  var registryPath = 'newsletter/series-registry.json';
  var registryJson = readFileFromGitHub(registryPath);
  var registry = registryJson ? JSON.parse(registryJson) : { series: [] };

  // 同名シリーズが既にあれば更新、なければ追加
  var found = false;
  for (var i = 0; i < registry.series.length; i++) {
    if (registry.series[i].seriesName === entry.seriesName) {
      registry.series[i] = entry;
      found = true;
      break;
    }
  }
  if (!found) {
    registry.series.push(entry);
  }

  pushFileToGitHub(registryPath,
    JSON.stringify(registry, null, 2),
    'Update series registry: ' + entry.seriesName);
}

// ── 月次レポート ──

/**
 * 全シリーズの月次アクティビティレポート（毎月1日タイマーで実行）
 */
function sendMonthlySeriesReport() {
  var series = getSeriesList();
  if (series.length === 0) return;

  var now = new Date();
  var lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  var monthLabel = Utilities.formatDate(lastMonth, 'Asia/Tokyo', 'yyyy年MM月');

  var body = '【NDL Newsletter 月次レポート】\n' + monthLabel + '\n\n';

  series.forEach(function(s) {
    if (s.status !== 'active') return;

    var scheduleJson = readFileFromGitHub('schedule.json', s.repo);
    if (!scheduleJson) return;
    var schedule = JSON.parse(scheduleJson);

    var lastMonthStr = Utilities.formatDate(lastMonth, 'Asia/Tokyo', 'yyyy-MM');
    var monthIssues = schedule.issues.filter(function(i) {
      return i.date && i.date.substring(0, 7) === lastMonthStr && i.status === 'published';
    });

    body += '━━━ ' + s.seriesName + ' ━━━\n'
      + '  発行数: ' + monthIssues.length + '号\n'
      + '  累計: ' + schedule.current_serial + '号\n\n';
  });

  sendEmail(NOTIFY_EMAIL, '【NDL】月次レポート ' + monthLabel, body);
}

// ── processStoragePipeline() 連携（物理注文からのルーティング）──

/**
 * processStoragePipeline() の拡張:
 * NDL納本対象の物理注文をシリーズリポジトリにルーティング
 *
 * processStoragePipeline() 内で以下のように呼び出す:
 *
 *   if (forNewsletter.length > 0) {
 *     try {
 *       routeOrdersToSeries(forNewsletter);
 *     } catch (e) {
 *       sendEmail(NOTIFY_EMAIL, '【NDL】ルーティングエラー', e.message);
 *     }
 *   }
 *
 * ※ 物理注文（ラミネート/クォーツ）でstorageNdl='Yes'の場合に使用
 * ※ 物理注文はデフォルトシリーズ 'TokiStorage' にルーティング
 */
function routeOrdersToSeries(forNewsletter) {
  if (!forNewsletter || forNewsletter.length === 0) return;

  // デフォルトシリーズ（TokiStorage自身の特集）
  var defaultSeries = findSeries('TokiStorage');
  if (!defaultSeries) return;

  var routed = [];

  forNewsletter.forEach(function(o) {
    if (!o.qrUrl) return;

    var scheduleJson = readFileFromGitHub('schedule.json', defaultSeries.repo);
    if (!scheduleJson) return;
    var schedule = JSON.parse(scheduleJson);

    var nextSerial = (schedule.current_serial || 0) + 1;
    var startYear = schedule.volume_start_year || 2026;
    var duration = schedule.volume_duration_years || 20;
    var vn = calcVolumeNumber(nextSerial, startYear, duration);

    var serialStr = String(nextSerial).padStart(5, '0');
    var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');

    // materials JSON を組み立て
    var materials = {
      serial: nextSerial,
      volume: vn.volume,
      number: vn.number,
      seriesName: 'TokiStorage',
      title: (o.name || '') + '様',
      urls: o.urls || [o.qrUrl],
      metadata: o.metadata || {},
      date: today
    };
    var materialsPath = 'materials/' + serialStr + '.json';

    try {
      var branch = 'tq-' + serialStr;
      createGitHubBranch(branch, defaultSeries.repo);

      commitFileOnBranch(materialsPath, JSON.stringify(materials, null, 2),
        'Add materials ' + serialStr, branch, defaultSeries.repo);

      schedule.current_serial = nextSerial;
      schedule.issues.push({
        date: today,
        serial: nextSerial,
        volume: vn.volume,
        number: vn.number,
        status: 'building',
        title: (o.name || '') + '様',
        orderId: o.orderId,
        customerName: o.name || ''
      });
      commitFileOnBranch('schedule.json', JSON.stringify(schedule, null, 2),
        'Update schedule: TQ-' + serialStr, branch, defaultSeries.repo);

      createGitHubPR(
        'TQ-' + serialStr + ': ' + (o.name || '') + '様',
        branch,
        'NDL serial publication #' + nextSerial + ' from order ' + o.orderId
        + '\n\nbuild-newsletter.yml will generate the PDF after merge.',
        defaultSeries.repo
      );

      routed.push({ orderId: o.orderId, serial: nextSerial, status: 'OK' });
    } catch (e) {
      routed.push({ orderId: o.orderId, status: 'ERROR: ' + e.message });
    }
  });

  if (routed.length > 0) {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var lastSerial = routed.filter(function(r) { return r.serial; });
    if (lastSerial.length > 0) {
      var maxSerial = Math.max.apply(null, lastSerial.map(function(r) { return r.serial; }));
      updateSeriesIssueCount(ss, 'TokiStorage', maxSerial);
    }

    var body = '【NDL パイプライン】' + routed.length + '件発行\n\n';
    routed.forEach(function(r) {
      body += r.orderId;
      if (r.serial) body += ' (TQ-' + String(r.serial).padStart(5, '0') + ')';
      body += ': ' + r.status + '\n';
    });
    sendEmail(NOTIFY_EMAIL, '【NDL】' + routed.length + '件発行', body);
  }
}
