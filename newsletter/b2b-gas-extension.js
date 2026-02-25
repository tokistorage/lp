/**
 * B2B NDL Newsletter Publishing Service — GAS Extension
 *
 * このファイルは qr/gas/code.gs の末尾に追記するコードです。
 * GASエディタで手動でペーストしてください。
 *
 * また、processStoragePipeline() 内のスプレッドシート更新の直前に
 * 以下の呼び出しを追加してください:
 *
 *   // ── B2Bクライアントリポジトリにもルーティング ──
 *   if (forNewsletter.length > 0) {
 *     try {
 *       routeToB2BClientRepos(forNewsletter, volumeInfo);
 *     } catch (e) {
 *       sendEmail(NOTIFY_EMAIL, '【B2B】ルーティングエラー', e.message);
 *     }
 *   }
 *
 * タイマートリガー設定:
 *   - advanceAllClientNewsletterIssues() → 毎日 9:00
 *   - sendMonthlyB2BReport() → 毎月1日 9:00
 */

// =====================================================
// B2B NDL Newsletter Publishing Service
// =====================================================

var B2B_SHEET_NAME = 'B2Bクライアント';
var B2B_SHEET_HEADERS = [
  '日時', 'クライアントID', '名称', 'リポジトリ', 'ステータス',
  'プラン', 'Wiseタグ', '発行費/号', 'QRスロット数', '追加QR単価',
  '作成日', '備考'
];

/**
 * B2Bクライアント一覧を取得
 */
function getB2BClients() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(B2B_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return [];
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 12).getValues();
  return data.filter(function(r) { return r[1]; }).map(function(r) {
    return {
      date: r[0],
      clientId: r[1],
      clientName: r[2],
      repo: r[3],
      status: r[4],
      plan: r[5],
      wiseTag: r[6],
      pricePerIssue: r[7] || 30000,
      includedQrSlots: r[8] || 50,
      extraQrPrice: r[9] || 150,
      createdAt: r[10],
      note: r[11]
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
    cadence_months: config.schedule ? config.schedule.cadenceMonths : 3,
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

  // 2e. generate-newsletter workflow
  var templateWorkflow = readFileFromGitHub(
    'newsletter/client-template/.github/workflows/generate-newsletter.yml');
  if (templateWorkflow) {
    commitFileOnBranch('.github/workflows/generate-newsletter.yml', templateWorkflow,
      'Add newsletter generation workflow', 'main', repo);
  }

  // 2f. .gitkeep for directories
  commitFileOnBranch('materials/.gitkeep', '',
    'Add materials directory', 'main', repo);
  commitFileOnBranch('output/.gitkeep', '',
    'Add output directory', 'main', repo);

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
    config.billing ? config.billing.model : 'per_issue',
    config.billing ? config.billing.wiseTag : clientId,
    config.billing ? config.billing.pricePerIssue : 30000,
    config.billing ? config.billing.includedQrSlots : 50,
    config.billing ? config.billing.extraQrPrice : 150,
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
 * processStoragePipeline() のB2B拡張:
 * NDL納本対象注文をB2Bクライアントリポジトリにもルーティング
 */
function routeToB2BClientRepos(forNewsletter, volumeInfo) {
  if (!forNewsletter || forNewsletter.length === 0) return;

  var clients = getB2BClients();
  if (clients.length === 0) return;

  var clientMap = {};
  clients.forEach(function(c) { clientMap[c.wiseTag] = c; });

  var routed = [];

  forNewsletter.forEach(function(o) {
    var client = o.ref ? clientMap[o.ref.trim()] : null;
    if (!client || client.status !== 'active') return;

    var scheduleJson = readFileFromGitHub('schedule.json', client.repo);
    if (!scheduleJson) return;
    var schedule = JSON.parse(scheduleJson);
    var currentIssue = schedule.issues.length > 0
      ? schedule.issues[schedule.issues.length - 1] : null;
    if (!currentIssue) return;
    var issueDate = currentIssue.date;

    var manifestPath = 'materials/' + issueDate + '/manifest.json';
    var manifestJson = readFileFromGitHub(manifestPath, client.repo);
    var manifest;
    if (manifestJson) {
      manifest = JSON.parse(manifestJson);
    } else {
      manifest = {
        issue: currentIssue,
        materials: [],
        lastUpdated: new Date().toISOString()
      };
    }

    var tokiqrPdfPath = 'materials/' + issueDate + '/tokiqr/tokiqr-' + o.orderId + '.pdf';

    if (o.qrUrl) {
      try {
        var pdfBase64 = generateTokiqrPdf(o);
        var branch = 'material-' + o.orderId;
        createGitHubBranch(branch, client.repo);
        commitBinaryFileOnBranch(tokiqrPdfPath, pdfBase64,
          'Add TokiQR PDF for ' + o.orderId, branch, client.repo);

        manifest.materials.push({
          orderId: o.orderId,
          displayName: o.name + '様',
          product: o.product.indexOf('クォーツ') !== -1 ? 'quartz' : 'laminate',
          qrUrl: o.qrUrl || '',
          tokiqrPdf: tokiqrPdfPath,
          addedAt: new Date().toISOString()
        });
        manifest.lastUpdated = new Date().toISOString();
        commitFileOnBranch(manifestPath, JSON.stringify(manifest, null, 2),
          'Update manifest for ' + o.orderId, branch, client.repo);

        createGitHubPR(
          'Add TokiQR: ' + o.name + '様 (' + o.orderId + ')',
          branch,
          'B2B newsletter material from order ' + o.orderId,
          client.repo
        );

        routed.push({ orderId: o.orderId, clientId: client.clientId, status: 'OK' });
      } catch (e) {
        routed.push({ orderId: o.orderId, clientId: client.clientId, status: 'ERROR: ' + e.message });
      }
    }
  });

  if (routed.length > 0) {
    var body = '【B2B パイプライン】' + routed.length + '件ルーティング\n\n';
    routed.forEach(function(r) {
      body += r.orderId + ' → ' + r.clientId + ': ' + r.status + '\n';
    });
    sendEmail(NOTIFY_EMAIL, '【B2B】' + routed.length + '件ルーティング', body);
  }
}

/**
 * B2Bクライアントのニュースレター号を進行（次号ドラフト作成）
 */
function advanceClientNewsletterIssue(clientId) {
  var clients = getB2BClients();
  var client = clients.filter(function(c) { return c.clientId === clientId && c.status === 'active'; })[0];
  if (!client) return;

  var scheduleJson = readFileFromGitHub('schedule.json', client.repo);
  if (!scheduleJson) return;
  var schedule = JSON.parse(scheduleJson);

  if (schedule.issues.length === 0) {
    var firstIssue = {
      date: Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy') + '-'
        + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'MM'),
      year: parseInt(Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy')),
      month: parseInt(Utilities.formatDate(new Date(), 'Asia/Tokyo', 'MM')),
      serial: 1, volume: 1, number: 1, status: 'drafting'
    };
    schedule.issues.push(firstIssue);
    schedule.current_serial = 1;
    pushFileToGitHub('schedule.json', JSON.stringify(schedule, null, 2),
      'Initialize first issue', client.repo);
    var manifest = { issue: firstIssue, materials: [], lastUpdated: new Date().toISOString() };
    pushFileToGitHub('materials/' + firstIssue.date + '/manifest.json',
      JSON.stringify(manifest, null, 2), 'Initialize first issue manifest', client.repo);
    return;
  }

  var currentIssue = schedule.issues[schedule.issues.length - 1];
  var issueEndDate = new Date(currentIssue.year, currentIssue.month, 0);
  var now = new Date();
  if (currentIssue.status === 'drafting' && now <= issueEndDate) return;

  if (currentIssue.status === 'drafting') currentIssue.status = 'published';

  var cadence = schedule.cadence_months || 3;
  var nextMonth = currentIssue.month + cadence;
  var nextYear = currentIssue.year;
  while (nextMonth > 12) { nextMonth -= 12; nextYear++; }

  var volDuration = schedule.volume_duration_years || 20;
  var startYear = schedule.volume_start_year || 2026;
  var nextVolume = Math.floor((nextYear - startYear) / volDuration) + 1;
  var nextNumber = nextVolume === currentIssue.volume ? currentIssue.number + 1 : 1;
  var nextSerial = currentIssue.serial + 1;

  var nextIssue = {
    date: nextYear + '-' + String(nextMonth).padStart(2, '0'),
    year: nextYear, month: nextMonth, serial: nextSerial,
    volume: nextVolume, number: nextNumber, status: 'drafting'
  };

  schedule.issues.push(nextIssue);
  schedule.current_serial = nextSerial;
  pushFileToGitHub('schedule.json', JSON.stringify(schedule, null, 2),
    'Advance to issue ' + nextIssue.date, client.repo);

  var manifest = { issue: nextIssue, materials: [], lastUpdated: new Date().toISOString() };
  pushFileToGitHub('materials/' + nextIssue.date + '/manifest.json',
    JSON.stringify(manifest, null, 2), 'Initialize manifest for ' + nextIssue.date, client.repo);

  sendEmail(NOTIFY_EMAIL,
    '【B2B】' + client.clientName + ' 次号: ' + nextIssue.date,
    'Vol.' + nextVolume + ' No.' + nextNumber + ' (通巻' + nextSerial + ')');
}

/**
 * 全B2Bクライアントの号進行チェック（毎日タイマーで実行）
 */
function advanceAllClientNewsletterIssues() {
  var clients = getB2BClients();
  clients.forEach(function(c) {
    if (c.status === 'active') {
      try { advanceClientNewsletterIssue(c.clientId); }
      catch (e) { sendEmail(NOTIFY_EMAIL, '【B2B】号進行エラー: ' + c.clientName, e.message); }
    }
  });
}

/**
 * B2Bクライアント月次請求レポート（毎月1日タイマーで実行）
 */
function sendMonthlyB2BReport() {
  var clients = getB2BClients();
  if (clients.length === 0) return;

  var orders = getOrders();
  var now = new Date();
  var lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  var lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  var monthLabel = Utilities.formatDate(lastMonth, 'Asia/Tokyo', 'yyyy年MM月');

  var body = '【B2B NDL Newsletter 月次レポート】\n' + monthLabel + '\n\n';

  clients.forEach(function(client) {
    if (client.status !== 'active') return;
    var clientOrders = orders.filter(function(o) {
      var d = new Date(o.date);
      return d >= lastMonth && d <= lastMonthEnd
        && o.ref && o.ref.trim() === client.wiseTag && o.storageNdl === 'Yes';
    });
    var qrCount = clientOrders.length;
    var extra = Math.max(0, qrCount - client.includedQrSlots);
    var extraFee = extra * client.extraQrPrice;
    var total = qrCount > 0 ? client.pricePerIssue + extraFee : 0;

    body += '━━━ ' + client.clientName + ' (' + client.clientId + ') ━━━\n'
      + '  QR数: ' + qrCount + ' / 追加: ' + extra + '件\n'
      + '  合計: ¥' + total.toLocaleString() + '\n';
    if (total > 0 && client.wiseTag) {
      body += '  請求: https://wise.com/pay/' + client.wiseTag + '\n';
    }
    body += '\n';
  });

  sendEmail(NOTIFY_EMAIL, '【B2B】月次請求レポート ' + monthLabel, body);
}
