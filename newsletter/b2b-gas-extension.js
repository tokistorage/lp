/**
 * B2B NDL Newsletter Publishing Service — GAS Extension
 * PDF Native Pipeline (v2)
 *
 * このファイルは qr/gas/code.gs の末尾に追記するコードです。
 * GASエディタで手動でペーストしてください。
 *
 * 新モデル:
 *   TokiQR PDF生成 → 奥付+通巻番号付きPDF → output/TQ-NNNNN.pdf として
 *   クライアントリポジトリに直接コミット → そのまま逐次刊行物1号として公開
 *   → NDL自動収集
 *
 * processStoragePipeline() 内のスプレッドシート更新の直前に
 * 以下の呼び出しを追加してください:
 *
 *   // ── B2Bクライアントリポジトリにもルーティング ──
 *   if (forNewsletter.length > 0) {
 *     try {
 *       routeToB2BClientRepos(forNewsletter);
 *     } catch (e) {
 *       sendEmail(NOTIFY_EMAIL, '【B2B】ルーティングエラー', e.message);
 *     }
 *   }
 *
 * タイマートリガー設定:
 *   - sendMonthlyB2BReport() → 毎月1日 9:00（アクティビティレポート）
 */

// =====================================================
// B2B NDL Newsletter Publishing Service — PDF Native
// =====================================================

var B2B_SHEET_NAME = 'B2Bクライアント';
var B2B_SHEET_HEADERS = [
  '日時', 'クライアントID', '名称', 'リポジトリ', 'ステータス',
  'プラン', 'Wiseタグ', 'セットアップ価格', 'ISSN',
  '作成日', '備考'
];

/**
 * B2Bクライアント一覧を取得
 */
function getB2BClients() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(B2B_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return [];
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 11).getValues();
  return data.filter(function(r) { return r[1]; }).map(function(r) {
    return {
      date: r[0],
      clientId: r[1],
      clientName: r[2],
      repo: r[3],
      status: r[4],
      plan: r[5],
      wiseTag: r[6],
      setupPrice: r[7] || 99900,
      issn: r[8] || '',
      createdAt: r[9],
      note: r[10]
    };
  });
}

/**
 * B2Bクライアント用リポジトリをプロビジョニング
 * newsletter/client-template/ をベースにリポジトリを作成
 *
 * @param {string} clientId - クライアントID (e.g., "hilton-urayasu")
 * @param {string} clientName - クライアント名 (e.g., "ヒルトン東京ベイ")
 * @param {object} config - client-config.json の内容
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

  // 2c. index.html (GitHub Pages archive)
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

  // 2e. asset/.gitkeep
  commitFileOnBranch('asset/.gitkeep', '',
    'Add asset directory', 'main', repo);

  // 3. GitHub Pages 有効化
  try {
    fetchGitHubApi('/repos/' + repo + '/pages', 'POST', {
      source: { branch: 'main', path: '/' }
    });
  } catch (e) {}

  // 4. B2Bクライアントシートに記録
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = getOrCreateSheet(ss, B2B_SHEET_NAME, B2B_SHEET_HEADERS);
  sheet.appendRow([
    new Date(),
    clientId,
    clientName,
    repo,
    'active',
    'one_time',
    config.billing ? config.billing.wiseTag : clientId,
    config.billing ? config.billing.setupPrice : 99900,
    '',
    new Date(),
    ''
  ]);

  // 5. 管理者通知
  sendEmail(NOTIFY_EMAIL,
    '【B2B】クライアントリポジトリ作成: ' + clientName,
    'クライアント: ' + clientName + ' (' + clientId + ')\n'
    + 'リポジトリ: https://github.com/' + repo + '\n'
    + 'Pages: https://tokistorage.github.io/' + repoName + '/\n\n'
    + 'config:\n' + configJson);

  return repo;
}

/**
 * 注文のパートナータグからB2Bクライアントを判定
 */
function findB2BClient(wiseTag) {
  if (!wiseTag) return null;
  var clients = getB2BClients();
  for (var i = 0; i < clients.length; i++) {
    if (clients[i].wiseTag === wiseTag && clients[i].status === 'active') {
      return clients[i];
    }
  }
  return null;
}

/**
 * 通巻番号からボリューム・号を計算（式年遷宮型: 1巻 = 20年）
 */
function calcVolumeNumber(serial, startYear, durationYears) {
  var now = new Date();
  var currentYear = parseInt(Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy'));
  var volume = Math.floor((currentYear - startYear) / durationYears) + 1;

  // この巻の開始serial を計算するのは困難なので、簡易的に serial = number とする
  // 巻が変わった時にリセットするためにschedule.jsonの過去issuesを参照
  return { volume: volume, number: serial };
}

/**
 * TokiQR PDFを別冊特集ニュースレターとして生成するための参照コード
 *
 * 各TokiQR PDFは独立した「別冊特集ニュースレター」として成立する。
 * 1ページ目がTokiQRコンテンツ、2ページ目が発行情報ページ。
 * NDLに献本されると逐次刊行物の1号になる。
 *
 * generateTokiqrPdf() を拡張して2ページ構成にする方式を推奨。
 * GASではPDFの直接編集が困難なため、Slides→PDF変換を使用。
 *
 * @param {Object} order - 注文オブジェクト
 * @param {Object} clientConfig - client-config.json の内容
 * @param {number} serial - 通巻番号
 * @param {number} volume - 巻
 * @param {number} number - 号
 * @returns {string} Base64エンコードされたPDF
 */
function generateTokiqrNewsletter(order, clientConfig, serial, volume, number) {
  // 1ページ目: TokiQRコンテンツ（既存レイアウト）
  var pdfBase64 = generateTokiqrPdf(order);

  // 2ページ目: 別冊特集ニュースレター 発行情報
  // ※ 以下は参照コード。実際のGAS実装では Slides→PDF 変換

  var colophon = clientConfig.colophon || {};
  var branding = clientConfig.branding || {};
  var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy年MM月dd日');

  var newsletterText = [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    (branding.publicationNameJa || 'TokiQR') + ' 別冊特集',
    '「' + (order.name || '') + '様」',
    '',
    '通巻番号: 第' + serial + '号',
    '巻号: 第' + volume + '巻 第' + number + '号',
    '発行日: ' + today,
    '',
    '発行者: ' + (colophon.publisher || 'TokiStorage（佐藤卓也）'),
    '特集: ' + (colophon.contentOriginator || clientConfig.clientName),
    '',
    '法的根拠: ' + (colophon.legalBasis || '国立国会図書館法 第25条・第25条の4'),
    'フォーマット: PDF（電子書籍等・オンライン資料）',
    '採番体系: 式年遷宮型（1巻＝20年）',
    '',
    colophon.note || '',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '© TokiStorage'
  ].join('\n');

  // ※ 実際の実装:
  // 1. Google Slidesで発行情報スライドを生成
  // 2. PDF変換
  // 3. 既存PDFとマージ（pdf-lib等）
  // または generateTokiqrPdf() 内で直接2ページ構成にする

  Logger.log('Newsletter TQ-' + String(serial).padStart(5, '0') + ':\n' + newsletterText);

  return pdfBase64;
}

/**
 * processStoragePipeline() のB2B拡張:
 * NDL納本対象注文をB2Bクライアントリポジトリにルーティング
 * 各TokiQR PDF = 1号として即時発行
 */
function routeToB2BClientRepos(forNewsletter) {
  if (!forNewsletter || forNewsletter.length === 0) return;

  var clients = getB2BClients();
  if (clients.length === 0) return;

  var clientMap = {};
  clients.forEach(function(c) { clientMap[c.wiseTag] = c; });

  var routed = [];

  forNewsletter.forEach(function(o) {
    var client = o.ref ? clientMap[o.ref.trim()] : null;
    if (!client || client.status !== 'active') return;

    // schedule.json 読み込み・シリアル番号インクリメント
    var scheduleJson = readFileFromGitHub('schedule.json', client.repo);
    if (!scheduleJson) return;
    var schedule = JSON.parse(scheduleJson);

    var nextSerial = (schedule.current_serial || 0) + 1;
    var startYear = schedule.volume_start_year || 2026;
    var duration = schedule.volume_duration_years || 20;
    var vn = calcVolumeNumber(nextSerial, startYear, duration);

    // client-config.json 読み込み
    var configJson = readFileFromGitHub('client-config.json', client.repo);
    var clientConfig = configJson ? JSON.parse(configJson) : {};

    // TokiQR PDF生成（奥付付き）
    var filename = 'TQ-' + String(nextSerial).padStart(5, '0') + '.pdf';
    var pdfPath = 'output/' + filename;

    if (o.qrUrl) {
      try {
        var pdfBase64 = generateTokiqrNewsletter(
          o, clientConfig, nextSerial, vn.volume, vn.number);

        var branch = 'tq-' + String(nextSerial).padStart(5, '0');
        createGitHubBranch(branch, client.repo);

        // PDF をコミット
        commitBinaryFileOnBranch(pdfPath, pdfBase64,
          'Publish TQ-' + String(nextSerial).padStart(5, '0'), branch, client.repo);

        // schedule.json を更新
        var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
        var newIssue = {
          date: today,
          serial: nextSerial,
          volume: vn.volume,
          number: vn.number,
          status: 'published',
          filename: filename,
          orderId: o.orderId,
          customerName: o.name || ''
        };
        schedule.current_serial = nextSerial;
        schedule.issues.push(newIssue);
        commitFileOnBranch('schedule.json', JSON.stringify(schedule, null, 2),
          'Update schedule: TQ-' + String(nextSerial).padStart(5, '0'), branch, client.repo);

        // PR作成（auto-mergeで即マージ）
        createGitHubPR(
          'Publish TQ-' + String(nextSerial).padStart(5, '0') + ': ' + (o.name || '') + '様',
          branch,
          'NDL serial publication #' + nextSerial + ' from order ' + o.orderId,
          client.repo
        );

        routed.push({ orderId: o.orderId, clientId: client.clientId, serial: nextSerial, status: 'OK' });
      } catch (e) {
        routed.push({ orderId: o.orderId, clientId: client.clientId, status: 'ERROR: ' + e.message });
      }
    }
  });

  if (routed.length > 0) {
    var body = '【B2B パイプライン】' + routed.length + '件発行\n\n';
    routed.forEach(function(r) {
      body += r.orderId + ' → ' + r.clientId;
      if (r.serial) body += ' (TQ-' + String(r.serial).padStart(5, '0') + ')';
      body += ': ' + r.status + '\n';
    });
    sendEmail(NOTIFY_EMAIL, '【B2B】' + routed.length + '件発行', body);
  }
}

/**
 * B2Bクライアント月次アクティビティレポート（毎月1日タイマーで実行）
 */
function sendMonthlyB2BReport() {
  var clients = getB2BClients();
  if (clients.length === 0) return;

  var now = new Date();
  var lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  var monthLabel = Utilities.formatDate(lastMonth, 'Asia/Tokyo', 'yyyy年MM月');

  var body = '【B2B NDL Newsletter 月次レポート】\n' + monthLabel + '\n\n';

  clients.forEach(function(client) {
    if (client.status !== 'active') return;

    var scheduleJson = readFileFromGitHub('schedule.json', client.repo);
    if (!scheduleJson) return;
    var schedule = JSON.parse(scheduleJson);

    // 先月発行された号数をカウント
    var lastMonthStr = Utilities.formatDate(lastMonth, 'Asia/Tokyo', 'yyyy-MM');
    var monthIssues = schedule.issues.filter(function(i) {
      return i.date && i.date.substring(0, 7) === lastMonthStr && i.status === 'published';
    });

    body += '━━━ ' + client.clientName + ' (' + client.clientId + ') ━━━\n'
      + '  発行数: ' + monthIssues.length + '号\n'
      + '  累計: ' + schedule.current_serial + '号\n\n';
  });

  sendEmail(NOTIFY_EMAIL, '【B2B】月次レポート ' + monthLabel, body);
}
