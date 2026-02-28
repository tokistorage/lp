/**
 * NDL特集シリーズ — series_open / ndl_submit (ndl.gs)
 *
 * v5 変更点 (v4からの移行):
 *   - per-series リポジトリ → newsletter-master 集約
 *   - provisionClientRepo() 削除 → series.json エントリ追加のみ
 *   - materials JSON → ZIP+PNG (クライアントが生成、base64で受信)
 *   - series-registry.json (lp/) → series.json (newsletter-master)
 *
 * フロー:
 *   series_open: newsletter-master/series.json にエントリ追加
 *   ndl_submit: ZIP を newsletter-master/zips/{seriesId}/{serial}.zip にコミット
 *              + series.json の currentSerial 更新
 *
 * タイマートリガー設定:
 *   - sendMonthlySeriesReport() → 毎月1日 9:00（アクティビティレポート）
 */

// =====================================================
// NDL Newsletter Publishing — Master Repository (v5)
// =====================================================

var NEWSLETTER_MASTER = 'tokistorage/newsletter-master';

// ── シリーズ管理 ──

/**
 * 特集シリーズ一覧を取得（newsletter-master/series.json が唯一のソース）
 */
function getSeriesList() {
  var json = readFileFromGitHub('series.json', NEWSLETTER_MASTER);
  if (!json) return [];
  try {
    return JSON.parse(json).series || [];
  } catch (e) { return []; }
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
 * シリーズIDからアクティブなシリーズを検索
 */
function findSeriesById(seriesId) {
  if (!seriesId) return null;
  var list = getSeriesList();
  for (var i = 0; i < list.length; i++) {
    if (list[i].seriesId === seriesId && list[i].status === 'active') return list[i];
  }
  return null;
}

/**
 * シリーズ名からシリーズIDを生成
 * ハッシュ + タイムスタンプで一意性を確保
 */
function generateSeriesId(seriesName) {
  var hash = 0;
  for (var i = 0; i < seriesName.length; i++) {
    hash = ((hash << 5) - hash) + seriesName.charCodeAt(i);
    hash |= 0;
  }
  var ts = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMddHHmm');
  return 'ts-' + Math.abs(hash).toString(36) + '-' + ts;
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
 *   { success: true, seriesId: 'ts-abc123-202603010000' }
 *
 * 処理:
 *   1. 同名シリーズが存在すれば既存情報を返す
 *   2. なければ seriesId を生成
 *   3. newsletter-master/series.json にエントリ追加
 *   4. 管理者通知
 */
function handleSeriesOpen(ss, data) {
  var seriesName = (data.seriesName || '').trim();
  if (!seriesName) {
    return jsonResponse({ success: false, error: 'missing_series_name' });
  }

  // 既存シリーズチェック（冪等性: 同名で再呼び出しされても安全）
  var existing = findSeries(seriesName);
  if (existing) {
    return jsonResponse({
      success: true,
      seriesId: existing.seriesId,
      note: 'already_exists'
    });
  }

  var seriesId = generateSeriesId(seriesName);
  var startYear = parseInt(Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy'));

  // newsletter-master/series.json にエントリ追加
  var seriesJson = readFileFromGitHub('series.json', NEWSLETTER_MASTER);
  var registry = seriesJson ? JSON.parse(seriesJson) : { series: [] };

  registry.series.push({
    seriesId: seriesId,
    seriesName: seriesName,
    startYear: startYear,
    volumeDurationYears: 20,
    currentSerial: 0,
    createdAt: Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd'),
    status: 'active'
  });

  // ブランチ + PR で series.json 更新（auto-merge）
  var branch = 'series-' + seriesId;
  createGitHubBranch(branch, NEWSLETTER_MASTER);
  commitFileOnBranch('series.json', JSON.stringify(registry, null, 2),
    'Add series: ' + seriesName, branch, NEWSLETTER_MASTER);
  createGitHubPR('New series: ' + seriesName, branch,
    'Series: ' + seriesName + '\nID: ' + seriesId, NEWSLETTER_MASTER);

  // 管理者通知
  sendEmail(NOTIFY_EMAIL,
    '【NDL】新シリーズ開設: ' + seriesName,
    'シリーズ: ' + seriesName + '\n'
    + 'ID: ' + seriesId + '\n');

  return jsonResponse({
    success: true,
    seriesId: seriesId
  });
}

// ── エンドポイント: ndl_submit ──

/**
 * NDL献本提出
 *
 * リクエスト:
 *   {
 *     type: 'ndl_submit',
 *     seriesId: 'ts-abc123-202603010000',
 *     seriesName: '佐藤家族',
 *     title: '結婚式メッセージ',
 *     zipBase64: '...base64 encoded ZIP...',
 *     urls: ['play.html?m=7&c2=...'],
 *     metadata: { ts, tz, type, chunkCount }
 *   }
 *
 * レスポンス:
 *   { success: true, serial: 1, seriesId: 'ts-abc123-202603010000' }
 *
 * 処理:
 *   1. シリーズ検索（seriesId → seriesName フォールバック）
 *   2. series.json → currentSerial インクリメント
 *   3. ZIP を zips/{seriesId}/{serial}.zip にコミット
 *   4. series.json 更新・コミット
 *   5. PR作成（auto-merge）
 *   6. 管理者通知
 */
function handleNdlSubmit(ss, data) {
  var seriesId = (data.seriesId || '').trim();
  var seriesName = (data.seriesName || '').trim();
  if (!seriesId && !seriesName) {
    return jsonResponse({ success: false, error: 'missing_series_identifier' });
  }

  var series = (seriesId && findSeriesById(seriesId)) || findSeries(seriesName);
  if (!series) {
    return jsonResponse({ success: false, error: 'series_not_found' });
  }

  var zipBase64 = data.zipBase64 || '';
  var urls = data.urls || [];
  if (!zipBase64 && urls.length === 0) {
    return jsonResponse({ success: false, error: 'no_data' });
  }

  // series.json 読み込み（最新の currentSerial を取得）
  var seriesJson = readFileFromGitHub('series.json', NEWSLETTER_MASTER);
  if (!seriesJson) {
    return jsonResponse({ success: false, error: 'series_json_not_found' });
  }
  var registry = JSON.parse(seriesJson);

  // シリーズエントリを特定
  var seriesEntry = null;
  for (var i = 0; i < registry.series.length; i++) {
    if (registry.series[i].seriesId === series.seriesId) {
      seriesEntry = registry.series[i];
      break;
    }
  }
  if (!seriesEntry) {
    return jsonResponse({ success: false, error: 'series_entry_not_found' });
  }

  var nextSerial = (seriesEntry.currentSerial || 0) + 1;
  var startYear = seriesEntry.startYear || 2026;
  var duration = seriesEntry.volumeDurationYears || 20;
  var vn = calcVolumeNumber(nextSerial, startYear, duration);

  var serialStr = String(nextSerial).padStart(5, '0');

  try {
    var branch = 'tq-' + series.seriesId.substring(0, 20) + '-' + serialStr;
    createGitHubBranch(branch, NEWSLETTER_MASTER);

    // ZIP をコミット
    if (zipBase64) {
      var zipPath = 'zips/' + series.seriesId + '/' + serialStr + '.zip';
      commitBinaryFileOnBranch(zipPath, zipBase64,
        'Add ZIP ' + serialStr + ' for ' + series.seriesName, branch, NEWSLETTER_MASTER);
    } else {
      // フォールバック: URL のみの場合は materials JSON を保存
      var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm:ss");
      var materials = {
        serial: nextSerial,
        volume: vn.volume,
        number: vn.number,
        seriesName: series.seriesName,
        title: data.title || '',
        urls: urls,
        metadata: data.metadata || {},
        date: today
      };
      var materialsPath = 'zips/' + series.seriesId + '/' + serialStr + '.json';
      commitFileOnBranch(materialsPath, JSON.stringify(materials, null, 2),
        'Add materials ' + serialStr + ' for ' + series.seriesName, branch, NEWSLETTER_MASTER);
    }

    // series.json の currentSerial を更新
    seriesEntry.currentSerial = nextSerial;
    commitFileOnBranch('series.json', JSON.stringify(registry, null, 2),
      'Update serial: TQ-' + serialStr, branch, NEWSLETTER_MASTER);

    createGitHubPR(
      'TQ-' + serialStr + ': ' + (data.title || series.seriesName),
      branch,
      'NDL serial publication #' + nextSerial + '\n'
      + 'Series: ' + series.seriesName + '\n'
      + 'Title: ' + (data.title || '') + '\n'
      + (zipBase64 ? 'Format: ZIP+PNG' : 'Format: materials JSON (URLs: ' + urls.length + ')'),
      NEWSLETTER_MASTER
    );

    // 管理者通知
    sendEmail(NOTIFY_EMAIL,
      '【NDL】TQ-' + serialStr + ' 投入: ' + (data.title || series.seriesName),
      'シリーズ: ' + series.seriesName + '\n'
      + 'タイトル: ' + (data.title || '') + '\n'
      + '通巻: 第' + nextSerial + '号（第' + vn.volume + '巻 第' + vn.number + '号）\n'
      + 'フォーマット: ' + (zipBase64 ? 'ZIP+PNG' : 'materials JSON') + '\n');

    return jsonResponse({
      success: true,
      serial: nextSerial,
      seriesId: series.seriesId
    });
  } catch (e) {
    sendEmail(NOTIFY_EMAIL,
      '【NDL】投入エラー: ' + series.seriesName,
      'シリーズ: ' + series.seriesName + '\n'
      + 'エラー: ' + e.message + '\n'
      + 'スタック: ' + e.stack);
    return jsonResponse({ success: false, error: 'submit_failed', message: e.message });
  }
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
    body += '━━━ ' + s.seriesName + ' ━━━\n'
      + '  累計: ' + (s.currentSerial || 0) + '号\n\n';
  });

  sendEmail(NOTIFY_EMAIL, '【NDL】月次レポート ' + monthLabel, body);
}

// ── processStoragePipeline() 連携（物理注文からのルーティング）──

/**
 * NDL納本対象の物理注文を newsletter-master にルーティング
 * 全注文を1ブランチ・1PRにまとめて series.json 競合を回避
 *
 * ※ 物理注文（ラミネート/クォーツ）でstorageNdl='Yes'の場合に使用
 * ※ 物理注文はデフォルトシリーズ 'TokiStorage' にルーティング
 */
function routeOrdersToSeries(forNewsletter) {
  if (!forNewsletter || forNewsletter.length === 0) return;

  var defaultSeries = findSeries('TokiStorage');
  if (!defaultSeries) return;

  var seriesJson = readFileFromGitHub('series.json', NEWSLETTER_MASTER);
  if (!seriesJson) return;
  var registry = JSON.parse(seriesJson);

  var seriesEntry = null;
  for (var i = 0; i < registry.series.length; i++) {
    if (registry.series[i].seriesId === defaultSeries.seriesId) {
      seriesEntry = registry.series[i];
      break;
    }
  }
  if (!seriesEntry) return;

  // 全注文を1ブランチにまとめる
  var branch = 'route-' + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMddHHmmss');
  createGitHubBranch(branch, NEWSLETTER_MASTER);

  var routed = [];

  forNewsletter.forEach(function(o) {
    if (!o.qrUrl) return;

    var nextSerial = (seriesEntry.currentSerial || 0) + 1;
    var startYear = seriesEntry.startYear || 2026;
    var duration = seriesEntry.volumeDurationYears || 20;
    var vn = calcVolumeNumber(nextSerial, startYear, duration);

    var serialStr = String(nextSerial).padStart(5, '0');
    var today = Utilities.formatDate(new Date(), 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm:ss");

    var materials = {
      serial: nextSerial,
      volume: vn.volume,
      number: vn.number,
      seriesName: 'TokiStorage',
      title: (o.wisetag || o.orderId) + '様',
      urls: o.urls || [o.qrUrl],
      metadata: o.metadata || {},
      date: today
    };
    var materialsPath = 'zips/' + defaultSeries.seriesId + '/' + serialStr + '.json';

    try {
      commitFileOnBranch(materialsPath, JSON.stringify(materials, null, 2),
        'Add materials ' + serialStr, branch, NEWSLETTER_MASTER);
      seriesEntry.currentSerial = nextSerial;
      routed.push({ orderId: o.orderId, serial: nextSerial, status: 'OK' });
    } catch (e) {
      routed.push({ orderId: o.orderId, status: 'ERROR: ' + e.message });
    }
  });

  if (routed.length > 0) {
    // series.json を最終状態でコミット
    commitFileOnBranch('series.json', JSON.stringify(registry, null, 2),
      'Route ' + routed.length + ' orders', branch, NEWSLETTER_MASTER);

    var titles = routed.filter(function(r) { return r.serial; })
      .map(function(r) { return 'TQ-' + String(r.serial).padStart(5, '0'); });
    createGitHubPR(
      'Route ' + routed.length + ' orders: ' + titles.join(', '),
      branch,
      'NDL serial publications from physical orders\n\n'
      + routed.map(function(r) {
        return r.orderId + (r.serial ? ' (TQ-' + String(r.serial).padStart(5, '0') + ')' : '')
          + ': ' + r.status;
      }).join('\n'),
      NEWSLETTER_MASTER
    );

    var body = '【NDL パイプライン】' + routed.length + '件発行\n\n';
    routed.forEach(function(r) {
      body += r.orderId;
      if (r.serial) body += ' (TQ-' + String(r.serial).padStart(5, '0') + ')';
      body += ': ' + r.status + '\n';
    });
    sendEmail(NOTIFY_EMAIL, '【NDL】' + routed.length + '件発行', body);
  }
}

// ── シリーズリネーム ──

/**
 * シリーズ名を変更（newsletter-master/series.json を更新）
 *
 * リクエスト:
 *   { type: 'series_rename', seriesId: 'ts-abc123-202603010000', newName: '新しい名前' }
 */
function handleSeriesRename(ss, data) {
  var seriesId = (data.seriesId || '').trim();
  var newName = (data.newName || '').trim();
  if (!seriesId || !newName) return jsonResponse({ success: false, error: 'missing_params' });

  var seriesJson = readFileFromGitHub('series.json', NEWSLETTER_MASTER);
  if (!seriesJson) return jsonResponse({ success: false, error: 'series_not_found' });

  var registry = JSON.parse(seriesJson);
  var found = false;
  for (var i = 0; i < registry.series.length; i++) {
    if (registry.series[i].seriesId === seriesId) {
      registry.series[i].seriesName = newName;
      found = true;
      break;
    }
  }
  if (!found) return jsonResponse({ success: false, error: 'series_not_found' });

  var branch = 'rename-' + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMddHHmmss');
  createGitHubBranch(branch, NEWSLETTER_MASTER);
  commitFileOnBranch('series.json', JSON.stringify(registry, null, 2),
    'Rename series: ' + newName, branch, NEWSLETTER_MASTER);
  createGitHubPR('Rename series: ' + newName, branch,
    'Series ID: ' + seriesId + '\nNew name: ' + newName, NEWSLETTER_MASTER);

  return jsonResponse({ success: true });
}
