/**
 * NDL特集シリーズ — series_open / ndl_submit / processQueue (ndl.gs)
 *
 * v6 変更点 (v5からの移行):
 *   - 同期的な series.json 読み書き → キューベース非同期化
 *   - ndl_submit: queue/{id}.json + queue/{id}.zip を main に直接コミット → 即応答
 *   - routeOrdersToSeries: 同上、キューに書くだけ
 *   - processQueue: 毎時タイマーでキュー一括処理 → 採番 → zips/ 移動 → 1PR
 *
 * フロー:
 *   series_open: newsletter-master/series.json にエントリ追加（変更なし）
 *   ndl_submit: queue/{id}.json + queue/{id}.zip を main に直接コミット
 *   processQueue: queue/ 一括読取 → 採番 → zips/ 移動 → series.json 更新 → PR
 *
 * タイマートリガー設定:
 *   - processQueue() → 毎時0分（キュー処理）
 *   - sendMonthlySeriesReport() → 毎月1日 9:00（アクティビティレポート）
 */

// =====================================================
// NDL Newsletter Publishing — Master Repository (v6)
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
 * NDL献本提出（キューライター）
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
 *   { success: true, queued: true, queueId: '...' }
 *
 * 処理:
 *   1. バリデーション（シリーズ存在確認）
 *   2. queue/{id}.json + queue/{id}.zip を main に直接コミット
 *   3. 即応答（採番は processQueue が行う）
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

  // キューID生成: {yyyyMMddHHmmssSSS}-{random6}
  var now = new Date();
  var ts = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyyMMddHHmmss');
  var ms = String(now.getMilliseconds()).padStart(3, '0');
  var rand = Math.random().toString(36).substring(2, 8);
  var queueId = ts + ms + '-' + rand;

  try {
    var queueMeta = {
      seriesId: series.seriesId,
      seriesName: series.seriesName,
      title: data.title || '',
      urls: urls,
      hasZip: !!zipBase64,
      metadata: data.metadata || {},
      queuedAt: Utilities.formatDate(now, 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm:ss.SSS")
    };

    // queue/{id}.json をコミット（batchCommitFilesは text only なので個別コミット）
    if (zipBase64) {
      // ZIP + JSON を main に直接コミット（各ファイルがユニークパスなので衝突なし）
      commitFileOnBranch('queue/' + queueId + '.json', JSON.stringify(queueMeta, null, 2),
        'Queue NDL submit: ' + queueId, 'main', NEWSLETTER_MASTER);
      commitBinaryFileOnBranch('queue/' + queueId + '.zip', zipBase64,
        'Queue NDL ZIP: ' + queueId, 'main', NEWSLETTER_MASTER);
    } else {
      commitFileOnBranch('queue/' + queueId + '.json', JSON.stringify(queueMeta, null, 2),
        'Queue NDL submit: ' + queueId, 'main', NEWSLETTER_MASTER);
    }

    return jsonResponse({
      success: true,
      queued: true,
      queueId: queueId
    });
  } catch (e) {
    sendEmail(NOTIFY_EMAIL,
      '【NDL】キュー投入エラー: ' + series.seriesName,
      'シリーズ: ' + series.seriesName + '\n'
      + 'エラー: ' + e.message + '\n'
      + 'スタック: ' + e.stack);
    return jsonResponse({ success: false, error: 'queue_failed', message: e.message });
  }
}

// ── キュー処理（バッチプロセッサ）──

/**
 * オープン中のキューPRが存在するか確認（冪等性ガード）
 */
function hasOpenQueuePR() {
  try {
    var prs = fetchGitHubApi('/repos/' + NEWSLETTER_MASTER + '/pulls?state=open&head=tokistorage:queue-', 'GET');
    // head パラメータは前方一致ではないので手動フィルタ
    for (var i = 0; i < prs.length; i++) {
      if (prs[i].head && prs[i].head.ref && prs[i].head.ref.indexOf('queue-') === 0) {
        return true;
      }
    }
    return false;
  } catch (e) { return false; }
}

/**
 * キュー処理（毎時タイマートリガー）
 *
 * 処理フロー:
 *   1. オープン中のキューPRがあれば skip（冪等性）
 *   2. queue/ 一覧取得 → 空なら return
 *   3. .json ファイルを全件読み取り、queuedAt でソート
 *   4. series.json を1回だけ読み取り
 *   5. ブランチ作成
 *   6. 各エントリ: 採番 → zips/ にコミット → 削除リストに追加
 *   7. series.json コミット
 *   8. キューファイル削除
 *   9. PR作成 → auto-merge → build-pdf
 *  10. 管理者メール通知
 */
function processQueue() {
  // 1. 冪等性チェック
  if (hasOpenQueuePR()) return;

  // 2. キュー一覧取得
  var entries = listQueueEntries();
  if (entries.length === 0) return;

  // 3. .json ファイルを全件読み取り、queuedAt でソート
  var queueItems = [];
  var jsonEntries = entries.filter(function(e) { return e.name.endsWith('.json'); });

  for (var i = 0; i < jsonEntries.length; i++) {
    try {
      var content = readFileFromGitHub('queue/' + jsonEntries[i].name, NEWSLETTER_MASTER);
      if (content) {
        var meta = JSON.parse(content);
        meta._fileName = jsonEntries[i].name;
        meta._queueId = jsonEntries[i].name.replace('.json', '');
        queueItems.push(meta);
      }
    } catch (e) {
      // 読み取り失敗は次回リトライ
    }
  }

  if (queueItems.length === 0) return;

  // queuedAt でソート（採番順序の決定性）
  queueItems.sort(function(a, b) {
    return (a.queuedAt || '').localeCompare(b.queuedAt || '');
  });

  // 4. series.json を1回だけ読み取り
  var seriesJson = readFileFromGitHub('series.json', NEWSLETTER_MASTER);
  if (!seriesJson) {
    sendEmail(NOTIFY_EMAIL, '【NDL】キュー処理エラー', 'series.json の読み取りに失敗しました');
    return;
  }
  var registry = JSON.parse(seriesJson);

  // 5. ブランチ作成
  var branchTs = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMddHHmmss');
  var branch = 'queue-' + branchTs;
  createGitHubBranch(branch, NEWSLETTER_MASTER);

  var processed = [];
  var errors = [];
  var deleteList = []; // 削除対象キューファイルパス

  // 6. 各エントリを処理
  for (var j = 0; j < queueItems.length; j++) {
    var item = queueItems[j];
    try {
      // シリーズエントリを特定
      var seriesEntry = null;
      for (var k = 0; k < registry.series.length; k++) {
        if (registry.series[k].seriesId === item.seriesId) {
          seriesEntry = registry.series[k];
          break;
        }
      }
      if (!seriesEntry) {
        errors.push({ queueId: item._queueId, error: 'series_not_found: ' + item.seriesId });
        continue;
      }

      // 採番（インメモリ）
      var nextSerial = (seriesEntry.currentSerial || 0) + 1;
      var serialStr = String(nextSerial).padStart(5, '0');
      var vn = calcVolumeNumber(nextSerial, seriesEntry.startYear || 2026,
        seriesEntry.volumeDurationYears || 20);

      if (item.hasZip) {
        // ZIP を読み取り → zips/ にコミット
        var zipBase64 = readBinaryFromGitHub('queue/' + item._queueId + '.zip', NEWSLETTER_MASTER);
        if (!zipBase64) {
          errors.push({ queueId: item._queueId, error: 'zip_not_found' });
          continue;
        }
        var zipPath = 'zips/' + item.seriesId + '/' + serialStr + '.zip';
        commitBinaryFileOnBranch(zipPath, zipBase64,
          'Add ZIP ' + serialStr + ' for ' + item.seriesName, branch, NEWSLETTER_MASTER);
        deleteList.push('queue/' + item._queueId + '.zip');
      } else {
        // materials JSON を保存
        var materials = {
          serial: nextSerial,
          volume: vn.volume,
          number: vn.number,
          seriesName: item.seriesName,
          title: item.title || '',
          urls: item.urls || [],
          metadata: item.metadata || {},
          date: item.queuedAt
        };
        var materialsPath = 'zips/' + item.seriesId + '/' + serialStr + '.json';
        commitFileOnBranch(materialsPath, JSON.stringify(materials, null, 2),
          'Add materials ' + serialStr + ' for ' + item.seriesName, branch, NEWSLETTER_MASTER);
      }

      // currentSerial 更新（インメモリ）
      seriesEntry.currentSerial = nextSerial;
      deleteList.push('queue/' + item._fileName);

      processed.push({
        queueId: item._queueId,
        seriesName: item.seriesName,
        serial: nextSerial,
        title: item.title || ''
      });
    } catch (e) {
      errors.push({ queueId: item._queueId, error: e.message });
      // 失敗したエントリのキューファイルは削除しない → 次回リトライ
    }
  }

  // 処理済みエントリがなければ PR 作成しない
  if (processed.length === 0) {
    if (errors.length > 0) {
      sendEmail(NOTIFY_EMAIL, '【NDL】キュー処理: 全件エラー',
        errors.map(function(e) { return e.queueId + ': ' + e.error; }).join('\n'));
    }
    return;
  }

  // 7. series.json コミット（全シリアル反映済み）
  commitFileOnBranch('series.json', JSON.stringify(registry, null, 2),
    'Update serials: ' + processed.map(function(p) {
      return 'TQ-' + String(p.serial).padStart(5, '0');
    }).join(', '), branch, NEWSLETTER_MASTER);

  // 8. キューファイル削除
  for (var d = 0; d < deleteList.length; d++) {
    try {
      deleteFileOnBranch(deleteList[d], branch, NEWSLETTER_MASTER);
    } catch (e) {
      // 削除失敗は致命的ではない（次回 processQueue で再検出されるが、
      // series.json の currentSerial は更新済みなので重複採番はない）
    }
  }

  // 9. PR作成
  var titles = processed.map(function(p) {
    return 'TQ-' + String(p.serial).padStart(5, '0');
  });
  createGitHubPR(
    'Queue batch: ' + titles.join(', '),
    branch,
    'NDL queue batch processing\n\n'
    + '## Processed (' + processed.length + ')\n'
    + processed.map(function(p) {
      return '- TQ-' + String(p.serial).padStart(5, '0') + ': '
        + p.seriesName + ' — ' + (p.title || '(no title)');
    }).join('\n')
    + (errors.length > 0
      ? '\n\n## Errors (' + errors.length + ')\n'
        + errors.map(function(e) { return '- ' + e.queueId + ': ' + e.error; }).join('\n')
      : ''),
    NEWSLETTER_MASTER
  );

  // 10. 管理者メール通知
  var body = '【NDL キュー処理完了】\n\n'
    + '処理件数: ' + processed.length + '件\n\n';
  processed.forEach(function(p) {
    body += 'TQ-' + String(p.serial).padStart(5, '0') + ': '
      + p.seriesName + ' — ' + (p.title || '(no title)') + '\n';
  });
  if (errors.length > 0) {
    body += '\nエラー: ' + errors.length + '件\n';
    errors.forEach(function(e) {
      body += e.queueId + ': ' + e.error + '\n';
    });
  }
  sendEmail(NOTIFY_EMAIL, '【NDL】キュー処理: ' + processed.length + '件発行', body);
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
 * NDL納本対象の物理注文をキューに投入
 * processQueue が一括でバッチ処理する
 *
 * ※ 物理注文（ラミネート/クォーツ）でstorageNdl='Yes'の場合に使用
 * ※ 物理注文はデフォルトシリーズ 'TokiStorage' にルーティング
 */
function routeOrdersToSeries(forNewsletter) {
  if (!forNewsletter || forNewsletter.length === 0) return;

  var defaultSeries = findSeries('TokiStorage');
  if (!defaultSeries) return;

  var routed = [];

  forNewsletter.forEach(function(o) {
    if (!o.qrUrl) return;

    var now = new Date();
    var ts = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyyMMddHHmmss');
    var ms = String(now.getMilliseconds()).padStart(3, '0');
    var rand = Math.random().toString(36).substring(2, 8);
    var queueId = 'route-' + ts + ms + '-' + rand;

    var queueMeta = {
      seriesId: defaultSeries.seriesId,
      seriesName: 'TokiStorage',
      title: (o.wisetag || o.orderId) + '様',
      urls: o.urls || [o.qrUrl],
      hasZip: false,
      metadata: o.metadata || {},
      queuedAt: Utilities.formatDate(now, 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm:ss.SSS")
    };

    try {
      commitFileOnBranch('queue/' + queueId + '.json', JSON.stringify(queueMeta, null, 2),
        'Queue route order: ' + (o.orderId || queueId), 'main', NEWSLETTER_MASTER);
      routed.push({ orderId: o.orderId, queueId: queueId, status: 'queued' });
    } catch (e) {
      routed.push({ orderId: o.orderId, status: 'ERROR: ' + e.message });
    }
  });

  if (routed.length > 0) {
    var body = '【NDL パイプライン】' + routed.length + '件キュー投入\n\n';
    routed.forEach(function(r) {
      body += r.orderId + ': ' + r.status;
      if (r.queueId) body += ' (' + r.queueId + ')';
      body += '\n';
    });
    sendEmail(NOTIFY_EMAIL, '【NDL】' + routed.length + '件キュー投入', body);
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
