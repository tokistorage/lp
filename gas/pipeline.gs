/**
 * 保管パイプライン — GitHub + NDL (pipeline.gs)
 */

function processStoragePipeline() {
  var orders = getOrders();
  var eligible = orders.filter(function(o) {
    return o.status === '入金済み'
      && !o.storageProcessed
      && (o.storageGithub === 'Yes' || o.storageNdl === 'Yes');
  });
  if (eligible.length === 0) return;

  var forGithub = eligible.filter(function(o) { return o.storageGithub === 'Yes'; });
  var forNewsletter = eligible.filter(function(o) { return o.storageNdl === 'Yes'; });
  var pdfResults = [];
  var volumeInfo = getCurrentVolumeInfo();

  // GitHub保管
  if (forGithub.length > 0) {
    var ghManifest = getTokiqrManifestFromGitHub() || createEmptyTokiqrManifest();
    var timestamp = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd-HHmmss');
    var archiveBranch = 'storage-' + timestamp + '-tokiqr';
    createGitHubBranch(archiveBranch, volumeInfo.repo);

    forGithub.forEach(function(o) {
      if (o.qrUrl) {
        try {
          var pdfBase64 = generateTokiqrPdf(o);
          var pdfPath = 'tokiqr/tokiqr-customer-' + o.orderId + '.pdf';
          commitBinaryFileOnBranch(pdfPath, pdfBase64, 'Add TokiQR PDF for ' + o.orderId, archiveBranch, volumeInfo.repo);
          pdfResults.push({ orderId: o.orderId, status: 'OK' });
        } catch (e) {
          pdfResults.push({ orderId: o.orderId, status: 'ERROR: ' + e.message });
        }
      } else {
        pdfResults.push({ orderId: o.orderId, status: 'SKIP (QR URL未設定)' });
      }
      var archiveUrl = volumeInfo.pagesUrl + 'tokiqr/tokiqr-customer-' + o.orderId + '.pdf';
      ghManifest.entries.push({
        orderId: o.orderId, displayName: o.wisetag || o.orderId,
        product: o.product.indexOf('クォーツ') !== -1 ? 'quartz' : 'laminate',
        qrUrl: o.qrUrl || '', tokiqrPdf: archiveUrl,
        newsletter: o.storageNdl === 'Yes', addedAt: new Date().toISOString()
      });
    });

    createGitHubPR('Add ' + forGithub.length + ' TokiQR PDF(s)', archiveBranch,
      'Automated TokiQR PDF storage.\nArchive: ' + volumeInfo.repo, volumeInfo.repo);

    ghManifest.lastUpdated = new Date().toISOString();
    var lpBranch = 'storage-' + timestamp + '-manifest';
    createGitHubBranch(lpBranch);
    commitFileOnBranch('tokiqr/manifest.json', JSON.stringify(ghManifest, null, 2),
      'Update tokiqr manifest for ' + forGithub.length + ' order(s)', lpBranch);
    createGitHubPR('Update tokiqr manifest for ' + forGithub.length + ' order(s)', lpBranch,
      'Automated manifest update.', GITHUB_REPO);
  }

  // ニュースレター掲載
  if (forNewsletter.length > 0) {
    var nlManifest = getNewsletterManifestFromGitHub() || createEmptyNewsletterManifest();
    forNewsletter.forEach(function(o) {
      var archiveUrl = volumeInfo.pagesUrl + 'tokiqr/tokiqr-customer-' + o.orderId + '.pdf';
      nlManifest.materials.push({
        orderId: o.orderId, displayName: o.wisetag || o.orderId,
        product: o.product.indexOf('クォーツ') !== -1 ? 'quartz' : 'laminate',
        qrUrl: o.qrUrl || '', tokiqrPdf: archiveUrl, addedAt: new Date().toISOString()
      });
    });
    nlManifest.lastUpdated = new Date().toISOString();
    pushFileToGitHub('newsletter/materials/' + getCurrentIssue() + '/manifest.json',
      JSON.stringify(nlManifest, null, 2),
      'Add newsletter materials for ' + forNewsletter.length + ' order(s)');
  }

  // NDLシリーズにルーティング
  if (forNewsletter.length > 0) {
    try { routeOrdersToSeries(forNewsletter); } catch (e) {
      sendEmail(NOTIFY_EMAIL, '【NDL】ルーティングエラー', e.message);
    }
  }

  // スプレッドシート更新
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('注文');
  eligible.forEach(function(o) {
    var label = [];
    if (o.storageGithub === 'Yes') label.push('GitHub');
    if (o.storageNdl === 'Yes') label.push('NL');
    sheet.getRange(o.row, 26).setValue(label.join('+') + '済み');
  });

  // 通知
  var body = '【保管パイプライン】' + eligible.length + '件処理\nアーカイブ: ' + volumeInfo.repo + '\n\n';
  eligible.forEach(function(o) {
    var opts = [];
    if (o.storageGithub === 'Yes') opts.push('GitHub');
    if (o.storageNdl === 'Yes') opts.push('NL/NDL');
    body += o.orderId + ' | ' + (o.wisetag || o.orderId) + ' | ' + opts.join(', ') + '\n';
  });
  sendEmail(NOTIFY_EMAIL, '【TokiQR】保管パイプライン ' + eligible.length + '件処理', body);
}

// TokiQR PDF生成
function generateTokiqrPdf(order) {
  var qrResponse = UrlFetchApp.fetch('https://quickchart.io/qr', {
    method: 'POST', contentType: 'application/json',
    payload: JSON.stringify({ text: order.qrUrl, width: 800, format: 'png', ecLevel: 'L' })
  });
  var qrBlob = qrResponse.getBlob();
  var doc = DocumentApp.create('TokiQR-' + order.orderId);
  var body = doc.getBody();
  body.setMarginTop(72); body.setMarginBottom(36); body.setMarginLeft(72); body.setMarginRight(72);

  var title = body.appendParagraph('TokiQR');
  title.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  title.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  var label = body.appendParagraph(order.wisetag || order.orderId);
  label.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  label.editAsText().setFontSize(14);

  var meta = body.appendParagraph('注文番号: ' + order.orderId);
  meta.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  meta.editAsText().setFontSize(10).setForegroundColor('#64748B');

  body.appendParagraph('');
  var img = body.appendImage(qrBlob);
  img.setWidth(360).setHeight(360);
  img.getParent().asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  body.appendParagraph('');

  var desc = body.appendParagraph('スマートフォンでスキャンすると肉声を再生できます');
  desc.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  desc.editAsText().setFontSize(10);

  var url = body.appendParagraph(order.qrUrl);
  url.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  url.editAsText().setFontSize(6).setForegroundColor('#94A3B8');

  body.appendParagraph('');

  var footer = body.appendParagraph('© TokiStorage — tokistorage.github.io/lp/');
  footer.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  footer.editAsText().setFontSize(8).setForegroundColor('#94A3B8');

  doc.saveAndClose();
  var pdfBlob = DriveApp.getFileById(doc.getId()).getAs('application/pdf');
  var base64 = Utilities.base64Encode(pdfBlob.getBytes());
  DriveApp.getFileById(doc.getId()).setTrashed(true);
  return base64;
}

// Manifest / Volume ヘルパー
function getTokiqrManifestFromGitHub() {
  try {
    var result = fetchGitHubApi('/repos/' + GITHUB_REPO + '/contents/tokiqr/manifest.json', 'GET');
    return JSON.parse(Utilities.newBlob(Utilities.base64Decode(result.content)).getDataAsString());
  } catch (e) { return null; }
}

function createEmptyTokiqrManifest() {
  return { description: 'GitHub保管されたTokiQRの一覧', entries: [], lastUpdated: new Date().toISOString() };
}

function getNewsletterManifestFromGitHub() {
  try {
    var path = 'newsletter/materials/' + getCurrentIssue() + '/manifest.json';
    var result = fetchGitHubApi('/repos/' + GITHUB_REPO + '/contents/' + path, 'GET');
    return JSON.parse(Utilities.newBlob(Utilities.base64Decode(result.content)).getDataAsString());
  } catch (e) { return null; }
}

function createEmptyNewsletterManifest() {
  return {
    issue: { year: 2026, month: 4, volume: 1, number: 2, serial: 2, status: 'drafting',
      title_ja: '第2号', title_en: 'No. 2' },
    essays: [], materials: [], lastUpdated: new Date().toISOString()
  };
}

function getCurrentIssue() {
  var prop = PropertiesService.getScriptProperties().getProperty('CURRENT_NEWSLETTER_ISSUE');
  return prop || CURRENT_NEWSLETTER_ISSUE;
}

function getCurrentVolumeInfo() {
  var scheduleJson = readFileFromGitHub('newsletter/schedule.json');
  if (!scheduleJson) {
    return { volume: 1, repo: 'tokistorage/newsletter-vol1', pagesUrl: 'https://tokistorage.github.io/newsletter-vol1/' };
  }
  var schedule = JSON.parse(scheduleJson);
  var currentIssue = schedule.issues[schedule.issues.length - 1];
  var volumeNum = currentIssue ? currentIssue.volume : 1;
  var volumeInfo = schedule.volumes[String(volumeNum)];
  return {
    volume: volumeNum,
    repo: volumeInfo ? volumeInfo.repo : 'tokistorage/newsletter-vol' + volumeNum,
    pagesUrl: volumeInfo ? volumeInfo.pages_url : 'https://tokistorage.github.io/newsletter-vol' + volumeNum + '/'
  };
}
