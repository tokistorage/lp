/**
 * NDL Newsletter Publishing Service — GAS Extension
 * PDF Native Pipeline (v3: 特集権ベース)
 *
 * このファイルは qr/gas/code.gs の末尾に追記するコードです。
 * GASエディタで手動でペーストしてください。
 *
 * v3 変更点 (v2からの移行):
 *   - B2B wiseTagベース → 特集権ベース（個人・法人共通）
 *   - バッチ発行 → 即時発行（TokiQR PDF = 1号）
 *   - processStoragePipeline()経由 → クライアント直接リクエスト
 *
 * アーキテクチャ:
 *   1. ユーザーが特集権を購入（Wise → TOKI-XXXX コード → type: tokushu）
 *   2. ユーザーがコードを有効化 → { tokushu: N } を返す
 *   3. ユーザーがバルクモードで新シリーズ開設 → series_open リクエスト
 *      → GitHub リポジトリ自動作成 → GitHub Pages 有効化
 *   4. ユーザーがバルク生成（献本チェック済み）→ ndl_submit リクエスト
 *      → TokiQR PDF（奥付付き）生成 → output/TQ-NNNNN.pdf コミット
 *      → schedule.json 更新 → PR自動マージ → NDL自動収集
 *
 * ┌──────────────────────────────────────────────┐
 * │ code.gs doPost() に追加するルーティング:      │
 * │                                              │
 * │   if (data.type === 'series_open')           │
 * │     return handleSeriesOpen(ss, data);       │
 * │                                              │
 * │   if (data.type === 'ndl_submit')            │
 * │     return handleNdlSubmit(ss, data);        │
 * └──────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │ code.gs handleWiseWebhook() の TOKI コード検出部分を置換:    │
 * │ (transfers#state-change / balances#credit 両方)              │
 * │                                                              │
 * │   var tokiMatch = ref.match(                                 │
 * │     /TOKI-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/);          │
 * │   if (!orderMatch && tokiMatch) {                            │
 * │     var amt = ...; var cur = ...;                            │
 * │     var isTokushu = /Tokushu/i.test(ref);                   │
 * │     if (isTokushu) {                                         │
 * │       var count = Math.floor(                                │
 * │         amt / (PRICES_TOKUSHU[cur]                           │
 * │               || PRICES_TOKUSHU['JPY']));                    │
 * │       if (count < 1) count = 1;                              │
 * │       registerCreditCode(ss, tokiMatch[0], count, 'tokushu');│
 * │     } else {                                                 │
 * │       var count = Math.floor(                                │
 * │         amt / (PRICES.credit[cur]                            │
 * │               || PRICES.credit['JPY']));                     │
 * │       if (count < 1) count = 1;                              │
 * │       registerCreditCode(ss, tokiMatch[0], count, 'multiQR');│
 * │     }                                                        │
 * │   }                                                          │
 * └──────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │ code.gs CREDIT_SHEET_NAME のヘッダー変更:                    │
 * │   旧: '日時','コード','クレジット数','注文番号',             │
 * │       'メールアドレス','ステータス','使用日時'               │
 * │   新: '日時','コード','数量','タイプ',                       │
 * │       '注文番号','メールアドレス','ステータス','使用日時'    │
 * │                                                              │
 * │ registerCreditCode() 修正:                                   │
 * │   function registerCreditCode(ss, code, count, type) {       │
 * │     type = type || 'multiQR';                                │
 * │     var sheet = getOrCreateSheet(ss, CREDIT_SHEET_NAME, [    │
 * │       '日時','コード','数量','タイプ',                       │
 * │       '注文番号','メールアドレス','ステータス','使用日時'    │
 * │     ]);                                                      │
 * │     // 重複チェック（既存と同じ）                            │
 * │     sheet.appendRow([                                        │
 * │       new Date(), code, count, type,                         │
 * │       'codeless', '', '未使用', ''                           │
 * │     ]);                                                      │
 * │   }                                                          │
 * │                                                              │
 * │ handleCreditActivation() 修正:                               │
 * │   var type = rows[i][3]; // タイプ列（新: index 3）         │
 * │   var count = rows[i][2];                                    │
 * │   sheet.getRange(i + 2, 7).setValue('使用済み');  // 列ずれ  │
 * │   sheet.getRange(i + 2, 8).setValue(new Date()); // 列ずれ  │
 * │   if (type === 'tokushu') {                                  │
 * │     return json({ success: true, tokushu: count });          │
 * │   } else {                                                   │
 * │     return json({ success: true, credits: count });          │
 * │   }                                                          │
 * └──────────────────────────────────────────────────────────────┘
 *
 * タイマートリガー設定:
 *   - sendMonthlySeriesReport() → 毎月1日 9:00（アクティビティレポート）
 */

// =====================================================
// NDL Newsletter Publishing — PDF Native (v3)
// =====================================================

var PRICES_TOKUSHU = { JPY: 9900, USD: 66 };

var SERIES_SHEET_NAME = '特集シリーズ';
var SERIES_SHEET_HEADERS = [
  '日時', 'シリーズ名', 'クライアントID', 'リポジトリ', 'ステータス',
  '発行数', '作成日', '備考'
];

// ── ヘルパー ──

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

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
    serviceType: 'general',
    branding: {
      accentColor: [37, 99, 235],
      publicationNameJa: seriesName + ' 特集',
      publicationNameEn: seriesName + ' Special Feature',
      tagline: '\u2500\u2500 ' + seriesName + ' \u2500\u2500'
    },
    colophon: {
      publisher: 'TokiStorage\uff08\u4f50\u85e4\u5353\u4e5f\uff09',
      publisherAddress: '\u3012279-0014 \u5343\u8449\u770c\u6d66\u5b89\u5e02\u660e\u6d772-11-13',
      contentOriginator: seriesName,
      legalBasis: '\u56fd\u7acb\u56fd\u4f1a\u56f3\u66f8\u9928\u6cd5 \u7b2c25\u6761\u30fb\u7b2c25\u6761\u306e4',
      note: '\u672c\u8a8c\u306f TokiStorage \u304c\u767a\u884c\u8005\u3068\u3057\u3066\u7d0d\u672c\u3059\u308b\u9010\u6b21\u520a\u884c\u7269\u3067\u3059\u3002'
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

  // 管理者通知
  sendEmail(NOTIFY_EMAIL,
    '\u3010NDL\u3011\u65b0\u30b7\u30ea\u30fc\u30ba\u958b\u8a2d: ' + seriesName,
    '\u30b7\u30ea\u30fc\u30ba: ' + seriesName + '\n'
    + '\u30ea\u30dd\u30b8\u30c8\u30ea: https://github.com/' + repo + '\n'
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
 *   { success: true, serial: 1, filename: 'TQ-00001.pdf',
 *     pagesUrl: 'https://tokistorage.github.io/.../output/TQ-00001.pdf' }
 *
 * 処理:
 *   1. シリーズ検索 → クライアントリポジトリ特定
 *   2. schedule.json → 通巻番号インクリメント
 *   3. client-config.json → 奥付データ取得
 *   4. TokiQR PDF生成（奥付付き）
 *   5. output/TQ-NNNNN.pdf をブランチにコミット
 *   6. schedule.json を更新・コミット
 *   7. PR作成（auto-mergeで即マージ）
 *   8. シリーズシートの発行数を更新
 *   9. 管理者通知
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

  // client-config.json 読み込み
  var configJson = readFileFromGitHub('client-config.json', series.repo);
  var clientConfig = configJson ? JSON.parse(configJson) : {};

  // ファイル名
  var serialStr = String(nextSerial).padStart(5, '0');
  var filename = 'TQ-' + serialStr + '.pdf';
  var pdfPath = 'output/' + filename;

  // PDF生成（奥付付き）
  var order = {
    name: data.title || seriesName,
    qrUrl: urls[0],
    urls: urls,
    metadata: data.metadata || {}
  };

  try {
    var pdfBase64 = generateTokiqrNewsletter(
      order, clientConfig, nextSerial, vn.volume, vn.number);

    // ブランチ作成 → PDF + schedule.json コミット → PR
    var branch = 'tq-' + serialStr;
    createGitHubBranch(branch, series.repo);

    commitBinaryFileOnBranch(pdfPath, pdfBase64,
      'Publish ' + filename, branch, series.repo);

    var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
    var newIssue = {
      date: today,
      serial: nextSerial,
      volume: vn.volume,
      number: vn.number,
      status: 'published',
      filename: filename,
      title: data.title || '',
      urlCount: urls.length
    };
    schedule.current_serial = nextSerial;
    schedule.issues.push(newIssue);
    commitFileOnBranch('schedule.json', JSON.stringify(schedule, null, 2),
      'Update schedule: ' + filename, branch, series.repo);

    createGitHubPR(
      'Publish ' + filename + ': ' + (data.title || seriesName),
      branch,
      'NDL serial publication #' + nextSerial + '\n'
      + 'URLs: ' + urls.length + '\n'
      + 'Title: ' + (data.title || ''),
      series.repo
    );

    // シリーズシートの発行数を更新
    updateSeriesIssueCount(ss, seriesName, nextSerial);

    // 管理者通知
    var repoName = series.repo.split('/')[1] || series.repo;
    sendEmail(NOTIFY_EMAIL,
      '\u3010NDL\u3011' + filename + ' \u767a\u884c: ' + (data.title || seriesName),
      '\u30b7\u30ea\u30fc\u30ba: ' + seriesName + '\n'
      + '\u30bf\u30a4\u30c8\u30eb: ' + (data.title || '') + '\n'
      + '\u30d5\u30a1\u30a4\u30eb: ' + filename + '\n'
      + '\u901a\u5dfb: \u7b2c' + nextSerial + '\u53f7\uff08\u7b2c' + vn.volume + '\u5dfb \u7b2c' + vn.number + '\u53f7\uff09\n'
      + 'URL\u6570: ' + urls.length + '\n'
      + '\u30ea\u30dd\u30b8\u30c8\u30ea: https://github.com/' + series.repo + '\n'
      + 'PDF: https://tokistorage.github.io/' + repoName + '/' + pdfPath);

    return jsonResponse({
      success: true,
      serial: nextSerial,
      filename: filename,
      pagesUrl: 'https://tokistorage.github.io/' + repoName + '/' + pdfPath
    });
  } catch (e) {
    sendEmail(NOTIFY_EMAIL,
      '\u3010NDL\u3011\u767a\u884c\u30a8\u30e9\u30fc: ' + seriesName,
      '\u30b7\u30ea\u30fc\u30ba: ' + seriesName + '\n'
      + '\u30a8\u30e9\u30fc: ' + e.message + '\n'
      + '\u30b9\u30bf\u30c3\u30af: ' + e.stack);
    return jsonResponse({ success: false, error: 'publish_failed', message: e.message });
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
    description: clientName + ' NDL Newsletter \u2014 Published by TokiStorage',
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

  // 2e. output/.gitkeep (PDFの配置先)
  commitFileOnBranch('output/.gitkeep', '',
    'Add output directory', 'main', repo);

  // 2f. manifest.json (PWA)
  var accentRgb = config.branding && config.branding.accentColor
    ? config.branding.accentColor : [37, 99, 235];
  var manifest = {
    name: (config.branding.publicationNameJa || clientName) + ' | TokiStorage',
    short_name: config.branding.publicationNameJa || clientName,
    start_url: './',
    scope: './',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: 'rgb(' + accentRgb.join(',') + ')',
    icons: [{
      src: 'https://tokistorage.github.io/lp/asset/tokistorage-icon-512.png',
      sizes: '512x512', type: 'image/png', purpose: 'any'
    }]
  };
  commitFileOnBranch('manifest.json', JSON.stringify(manifest, null, 2),
    'Add PWA manifest', 'main', repo);

  // 2g. service-worker.js (PWA offline)
  var templateSw = readFileFromGitHub('newsletter/client-template/service-worker.js');
  if (templateSw) {
    commitFileOnBranch('service-worker.js', templateSw,
      'Add service worker for offline support', 'main', repo);
  }

  // 3. GitHub Pages 有効化
  try {
    fetchGitHubApi('/repos/' + repo + '/pages', 'POST', {
      source: { branch: 'main', path: '/' }
    });
  } catch (e) {
    // Pages が既に有効の場合は無視
  }

  return repo;
}

// ── TokiQR ニュースレター PDF 生成 ──

/**
 * TokiQR PDFを別冊特集ニュースレターとして生成
 *
 * 各TokiQR PDFは独立した「別冊特集ニュースレター」として成立する。
 * 1ページ目がTokiQRコンテンツ、最終ページが発行情報（奥付）。
 *
 * @param {Object} order - { name, qrUrl, urls[], metadata }
 * @param {Object} clientConfig - client-config.json の内容
 * @param {number} serial - 通巻番号
 * @param {number} volume - 巻
 * @param {number} number - 号
 * @returns {string} Base64エンコードされたPDF
 */
function generateTokiqrNewsletter(order, clientConfig, serial, volume, number) {
  // 1ページ目: TokiQRコンテンツ（既存 generateTokiqrPdf を流用）
  var pdfBase64 = generateTokiqrPdf(order);

  // 2ページ目: 別冊特集ニュースレター 発行情報（奥付）
  // ※ GAS実装では Google Slides → PDF → PDFマージ を推奨
  // ※ または generateTokiqrPdf() 自体を2ページ構成に拡張

  var colophon = clientConfig.colophon || {};
  var branding = clientConfig.branding || {};
  var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy\u5e74MM\u6708dd\u65e5');
  var serialStr = String(serial).padStart(5, '0');

  var colophonText = [
    '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501',
    '',
    (branding.publicationNameJa || 'TokiQR') + ' \u5225\u518a\u7279\u96c6',
    '\u300c' + (order.name || '') + '\u300d',
    '',
    'TQ-' + serialStr,
    '\u901a\u5dfb\u756a\u53f7: \u7b2c' + serial + '\u53f7',
    '\u5dfb\u53f7: \u7b2c' + volume + '\u5dfb \u7b2c' + number + '\u53f7',
    '\u767a\u884c\u65e5: ' + today,
    '',
    '\u767a\u884c\u8005: ' + (colophon.publisher || 'TokiStorage\uff08\u4f50\u85e4\u5353\u4e5f\uff09'),
    '\u7279\u96c6: ' + (colophon.contentOriginator || clientConfig.clientName || ''),
    '',
    '\u6cd5\u7684\u6839\u62e0: ' + (colophon.legalBasis || '\u56fd\u7acb\u56fd\u4f1a\u56f3\u66f8\u9928\u6cd5 \u7b2c25\u6761\u30fb\u7b2c25\u6761\u306e4'),
    '\u30d5\u30a9\u30fc\u30de\u30c3\u30c8: PDF\uff08\u96fb\u5b50\u66f8\u7c4d\u7b49\u30fb\u30aa\u30f3\u30e9\u30a4\u30f3\u8cc7\u6599\uff09',
    '\u63a1\u756a\u4f53\u7cfb: \u5f0f\u5e74\u9077\u5bae\u578b\uff081\u5dfb\uff1d20\u5e74\uff09',
    '',
    colophon.note || '',
    '',
    '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501',
    '\u00a9 TokiStorage'
  ].join('\n');

  // TODO: Slides→PDF変換 + PDFマージの実装
  // 暫定的にログ出力のみ（pdfBase64 にはQRコンテンツのみ）
  Logger.log('Newsletter TQ-' + serialStr + ':\n' + colophonText);

  return pdfBase64;
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
  var monthLabel = Utilities.formatDate(lastMonth, 'Asia/Tokyo', 'yyyy\u5e74MM\u6708');

  var body = '\u3010NDL Newsletter \u6708\u6b21\u30ec\u30dd\u30fc\u30c8\u3011\n' + monthLabel + '\n\n';

  series.forEach(function(s) {
    if (s.status !== 'active') return;

    var scheduleJson = readFileFromGitHub('schedule.json', s.repo);
    if (!scheduleJson) return;
    var schedule = JSON.parse(scheduleJson);

    var lastMonthStr = Utilities.formatDate(lastMonth, 'Asia/Tokyo', 'yyyy-MM');
    var monthIssues = schedule.issues.filter(function(i) {
      return i.date && i.date.substring(0, 7) === lastMonthStr && i.status === 'published';
    });

    body += '\u2501\u2501\u2501 ' + s.seriesName + ' \u2501\u2501\u2501\n'
      + '  \u767a\u884c\u6570: ' + monthIssues.length + '\u53f7\n'
      + '  \u7d2f\u8a08: ' + schedule.current_serial + '\u53f7\n\n';
  });

  sendEmail(NOTIFY_EMAIL, '\u3010NDL\u3011\u6708\u6b21\u30ec\u30dd\u30fc\u30c8 ' + monthLabel, body);
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

    var configJson = readFileFromGitHub('client-config.json', defaultSeries.repo);
    var clientConfig = configJson ? JSON.parse(configJson) : {};

    var serialStr = String(nextSerial).padStart(5, '0');
    var filename = 'TQ-' + serialStr + '.pdf';
    var pdfPath = 'output/' + filename;

    try {
      var pdfBase64 = generateTokiqrNewsletter(
        o, clientConfig, nextSerial, vn.volume, vn.number);

      var branch = 'tq-' + serialStr;
      createGitHubBranch(branch, defaultSeries.repo);

      commitBinaryFileOnBranch(pdfPath, pdfBase64,
        'Publish ' + filename, branch, defaultSeries.repo);

      var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
      schedule.current_serial = nextSerial;
      schedule.issues.push({
        date: today,
        serial: nextSerial,
        volume: vn.volume,
        number: vn.number,
        status: 'published',
        filename: filename,
        orderId: o.orderId,
        customerName: o.name || ''
      });
      commitFileOnBranch('schedule.json', JSON.stringify(schedule, null, 2),
        'Update schedule: ' + filename, branch, defaultSeries.repo);

      createGitHubPR(
        'Publish ' + filename + ': ' + (o.name || '') + '\u69d8',
        branch,
        'NDL serial publication #' + nextSerial + ' from order ' + o.orderId,
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

    var body = '\u3010NDL \u30d1\u30a4\u30d7\u30e9\u30a4\u30f3\u3011' + routed.length + '\u4ef6\u767a\u884c\n\n';
    routed.forEach(function(r) {
      body += r.orderId;
      if (r.serial) body += ' (TQ-' + String(r.serial).padStart(5, '0') + ')';
      body += ': ' + r.status + '\n';
    });
    sendEmail(NOTIFY_EMAIL, '\u3010NDL\u3011' + routed.length + '\u4ef6\u767a\u884c', body);
  }
}
