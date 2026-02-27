/**
 * デイリー / 月次レポート (reports.gs)
 */

// ── ヘルパー ──

function _buildDigestSection(title, rows, colIndex, todayStr) {
  var todayRows = rows.filter(function(r) {
    if (!r[0]) return false;
    var d = new Date(r[0]);
    return Utilities.formatDate(d, 'Asia/Tokyo', 'yyyy-MM-dd') === todayStr;
  });
  if (todayRows.length === 0) return '';
  var section = '\n── ' + title + '（' + todayRows.length + '件）──\n';
  todayRows.forEach(function(r) {
    section += '  ' + (r[colIndex] || '(不明)') + '\n';
  });
  return section;
}

function _buildAccessReportSection(ss, todayStr) {
  var sheet = ss.getSheetByName('アクセスログ');
  if (!sheet || sheet.getLastRow() < 2) return '\n── アクセス ──\n  データなし\n';

  var data = sheet.getRange(2, 1, Math.min(sheet.getLastRow() - 1, 500), 11).getValues();
  var todayPVs = data.filter(function(r) {
    if (!r[0]) return false;
    var d = new Date(r[0]);
    return Utilities.formatDate(d, 'Asia/Tokyo', 'yyyy-MM-dd') === todayStr;
  });

  var visitors = {};
  var devCount = 0;
  todayPVs.forEach(function(r) {
    var vid = r[1] || 'unknown';
    var type = r[2] || 'visitor';
    if (type === 'dev') { devCount++; return; }
    visitors[vid] = (visitors[vid] || 0) + 1;
  });

  var uniqueVisitors = Object.keys(visitors).length;
  var totalPVs = todayPVs.length - devCount;

  var section = '\n── アクセス ──\n';
  section += '  PV: ' + totalPVs + '（開発: ' + devCount + '）\n';
  section += '  UU: ' + uniqueVisitors + '\n';

  // ページ別
  var pages = {};
  todayPVs.forEach(function(r) {
    if (r[2] === 'dev') return;
    var page = r[3] || r[4] || '(不明)';
    pages[page] = (pages[page] || 0) + 1;
  });
  var sortedPages = Object.keys(pages).sort(function(a, b) { return pages[b] - pages[a]; });
  if (sortedPages.length > 0) {
    section += '  ページ別:\n';
    sortedPages.slice(0, 10).forEach(function(p) {
      section += '    ' + p + ': ' + pages[p] + '\n';
    });
  }

  // 流入元別
  var sources = {};
  todayPVs.forEach(function(r) {
    if (r[2] === 'dev') return;
    var src = r[5] || '(direct)';
    sources[src] = (sources[src] || 0) + 1;
  });
  var sortedSources = Object.keys(sources).sort(function(a, b) { return sources[b] - sources[a]; });
  if (sortedSources.length > 0) {
    section += '  流入元:\n';
    sortedSources.slice(0, 5).forEach(function(s) {
      section += '    ' + s + ': ' + sources[s] + '\n';
    });
  }

  return section;
}

function _buildEventReportSection(ss, todayStr) {
  var sheet = ss.getSheetByName('イベントログ');
  if (!sheet || sheet.getLastRow() < 2) return '\n── イベント ──\n  データなし\n';

  var data = sheet.getRange(2, 1, Math.min(sheet.getLastRow() - 1, 500), 5).getValues();
  var todayEvents = data.filter(function(r) {
    if (!r[0]) return false;
    var d = new Date(r[0]);
    return Utilities.formatDate(d, 'Asia/Tokyo', 'yyyy-MM-dd') === todayStr;
  });

  if (todayEvents.length === 0) return '\n── イベント ──\n  データなし\n';

  var actions = {};
  todayEvents.forEach(function(r) {
    var action = r[1] || '(不明)';
    actions[action] = (actions[action] || 0) + 1;
  });

  var section = '\n── イベント（' + todayEvents.length + '件）──\n';
  var sortedActions = Object.keys(actions).sort(function(a, b) { return actions[b] - actions[a]; });
  sortedActions.forEach(function(a) {
    section += '  ' + a + ': ' + actions[a] + '\n';
  });

  return section;
}

// ── デイリーレポート ──

function sendDailyReport() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var todayStr = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');

  var subject = '【TokiQR】日次レポート ' + todayStr;
  var body = '=== TokiStorage 日次レポート ===\n' + todayStr + '\n';

  // 注文サマリー
  var orders = getOrders();
  var todayOrders = orders.filter(function(o) {
    return Utilities.formatDate(new Date(o.date), 'Asia/Tokyo', 'yyyy-MM-dd') === todayStr;
  });
  var paid = orders.filter(function(o) { return o.status === '入金済み'; });
  var shipped = orders.filter(function(o) { return o.status === '発送済み' || o.status === '配送済み'; });

  body += '\n── 注文 ──\n';
  body += '  本日新規: ' + todayOrders.length + '件\n';
  body += '  入金済み（未発送）: ' + paid.length + '件\n';
  body += '  発送済み: ' + shipped.length + '件\n';
  body += '  累計: ' + orders.length + '件\n';

  if (todayOrders.length > 0) {
    body += '\n  本日の注文:\n';
    todayOrders.forEach(function(o) {
      body += '    ' + o.orderId + ' | ' + (o.wisetag || o.orderId) + ' | ' + o.product + '\n';
    });
  }

  // アクセスレポート
  body += _buildAccessReportSection(ss, todayStr);

  // イベントレポート
  body += _buildEventReportSection(ss, todayStr);

  // お問い合わせ
  var contactSheet = ss.getSheetByName('お問い合わせ');
  if (contactSheet && contactSheet.getLastRow() >= 2) {
    var contactData = contactSheet.getRange(2, 1, contactSheet.getLastRow() - 1, 14).getValues();
    body += _buildDigestSection('お問い合わせ', contactData, 1, todayStr);
  }

  // クレジットコード
  var creditSheet = ss.getSheetByName(CREDIT_SHEET_NAME);
  if (creditSheet && creditSheet.getLastRow() >= 2) {
    var creditData = creditSheet.getRange(2, 1, creditSheet.getLastRow() - 1, 8).getValues();
    var todayActivations = creditData.filter(function(r) {
      if (!r[7]) return false;
      var d = new Date(r[7]);
      return Utilities.formatDate(d, 'Asia/Tokyo', 'yyyy-MM-dd') === todayStr;
    });
    var totalUnused = creditData.filter(function(r) { return r[6] === '未使用'; }).length;
    var totalUsed = creditData.filter(function(r) { return r[6] === '使用済み'; }).length;

    body += '\n── クレジットコード ──\n';
    body += '  本日有効化: ' + todayActivations.length + '件\n';
    body += '  未使用: ' + totalUnused + '件\n';
    body += '  使用済み: ' + totalUsed + '件\n';
  }

  body += '\n\n— TokiStorage GAS 自動レポート';
  sendEmail(NOTIFY_EMAIL, subject, body);
}

// ── 月次パートナーレポート ──

function sendMonthlyPartnerReport() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var orders = getOrders();
  var now = new Date();
  var lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  var lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  var monthLabel = Utilities.formatDate(lastMonth, 'Asia/Tokyo', 'yyyy年MM月');

  // 先月の注文を集計
  var monthlyOrders = orders.filter(function(o) {
    var d = new Date(o.date);
    return d >= lastMonth && d <= lastMonthEnd;
  });

  // パートナー別集計
  var partnerStats = {};
  monthlyOrders.forEach(function(o) {
    var partner = o.ref || '(ダイレクト)';
    if (!partnerStats[partner]) {
      partnerStats[partner] = { count: 0, revenue: 0, currency: o.currency || 'JPY' };
    }
    partnerStats[partner].count++;
    partnerStats[partner].revenue += o.total || 0;
  });

  var subject = '【TokiQR】月次レポート ' + monthLabel;
  var body = '=== TokiStorage 月次レポート ===\n' + monthLabel + '\n\n';

  // サマリー
  var totalRevenue = monthlyOrders.reduce(function(sum, o) { return sum + (o.total || 0); }, 0);
  body += '── サマリー ──\n';
  body += '  注文数: ' + monthlyOrders.length + '件\n';
  body += '  売上合計: ¥' + totalRevenue.toLocaleString() + '\n\n';

  // パートナー別
  body += '── パートナー別 ──\n';
  Object.keys(partnerStats).sort().forEach(function(partner) {
    var s = partnerStats[partner];
    var commission = Math.floor(s.revenue * PARTNER_SHARE);
    body += '  ' + partner + ':\n';
    body += '    注文数: ' + s.count + '件\n';
    body += '    売上: ¥' + s.revenue.toLocaleString() + '\n';
    if (partner !== '(ダイレクト)') {
      body += '    手数料(' + (PARTNER_SHARE * 100) + '%): ¥' + commission.toLocaleString() + '\n';
    }
    body += '\n';
  });

  // ステータス別集計（全注文）
  var statusCounts = {};
  orders.forEach(function(o) {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });
  body += '── ステータス別（全期間）──\n';
  Object.keys(statusCounts).forEach(function(s) {
    body += '  ' + s + ': ' + statusCounts[s] + '件\n';
  });

  // 保管統計
  var githubCount = orders.filter(function(o) { return o.storageGithub === 'Yes'; }).length;
  var ndlCount = orders.filter(function(o) { return o.storageNdl === 'Yes'; }).length;
  var sadoCount = orders.filter(function(o) { return o.storageSado === 'Yes'; }).length;
  var mauiCount = orders.filter(function(o) { return o.storageMaui === 'Yes'; }).length;

  body += '\n── 保管オプション（全期間）──\n';
  body += '  GitHub: ' + githubCount + '件\n';
  body += '  NDL: ' + ndlCount + '件\n';
  body += '  佐渡: ' + sadoCount + '件\n';
  body += '  Maui: ' + mauiCount + '件\n';

  // クレジットコード統計
  var creditSheet = ss.getSheetByName(CREDIT_SHEET_NAME);
  if (creditSheet && creditSheet.getLastRow() >= 2) {
    var creditData = creditSheet.getRange(2, 1, creditSheet.getLastRow() - 1, 8).getValues();
    var monthlyActivations = creditData.filter(function(r) {
      if (!r[7]) return false;
      var d = new Date(r[7]);
      return d >= lastMonth && d <= lastMonthEnd;
    });
    var totalCredits = creditData.reduce(function(sum, r) { return sum + (r[2] || 0); }, 0);
    var unusedCredits = creditData.filter(function(r) { return r[6] === '未使用'; })
      .reduce(function(sum, r) { return sum + (r[2] || 0); }, 0);

    body += '\n── クレジットコード ──\n';
    body += '  今月有効化: ' + monthlyActivations.length + '件\n';
    body += '  総発行クレジット: ' + totalCredits + '\n';
    body += '  未使用クレジット: ' + unusedCredits + '\n';
  }

  body += '\n\n— TokiStorage GAS 月次レポート';
  sendEmail(NOTIFY_EMAIL, subject, body);
}
