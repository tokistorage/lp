/**
 * GitHub API ヘルパー (github.gs)
 */

function fetchGitHubApi(endpoint, method, payload) {
  var options = {
    method: method,
    headers: {
      'Authorization': 'token ' + GITHUB_TOKEN,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'TokiStorage-GAS'
    },
    muteHttpExceptions: true
  };
  if (payload) {
    options.contentType = 'application/json';
    options.payload = JSON.stringify(payload);
  }
  var res = UrlFetchApp.fetch(GITHUB_API + endpoint, options);
  var code = res.getResponseCode();
  if (code >= 400) {
    throw new Error('GitHub API ' + code + ': ' + res.getContentText().substring(0, 200));
  }
  return JSON.parse(res.getContentText());
}

function createGitHubBranch(branchName, repo) {
  repo = repo || GITHUB_REPO;
  var mainRef = fetchGitHubApi('/repos/' + repo + '/git/ref/heads/main', 'GET');
  fetchGitHubApi('/repos/' + repo + '/git/refs', 'POST', {
    ref: 'refs/heads/' + branchName,
    sha: mainRef.object.sha
  });
}

function commitFileOnBranch(path, content, message, branch, repo) {
  repo = repo || GITHUB_REPO;
  var existingSha = null;
  try {
    var existing = fetchGitHubApi('/repos/' + repo + '/contents/' + path + '?ref=' + branch, 'GET');
    existingSha = existing.sha;
  } catch (e) {}
  var payload = {
    message: message + '\n\nCo-Authored-By: TokiStorage GAS <noreply@tokistorage.com>',
    content: Utilities.base64Encode(content, Utilities.Charset.UTF_8),
    branch: branch
  };
  if (existingSha) payload.sha = existingSha;
  fetchGitHubApi('/repos/' + repo + '/contents/' + path, 'PUT', payload);
}

function commitBinaryFileOnBranch(path, base64Content, message, branch, repo) {
  repo = repo || GITHUB_REPO;
  var existingSha = null;
  try {
    var existing = fetchGitHubApi('/repos/' + repo + '/contents/' + path + '?ref=' + branch, 'GET');
    existingSha = existing.sha;
  } catch (e) {}
  var payload = {
    message: message + '\n\nCo-Authored-By: TokiStorage GAS <noreply@tokistorage.com>',
    content: base64Content,
    branch: branch
  };
  if (existingSha) payload.sha = existingSha;
  fetchGitHubApi('/repos/' + repo + '/contents/' + path, 'PUT', payload);
}

function createGitHubPR(title, branch, body, repo) {
  repo = repo || GITHUB_REPO;
  return fetchGitHubApi('/repos/' + repo + '/pulls', 'POST', {
    title: title, head: branch, base: 'main', body: body
  });
}

function readFileFromGitHub(path, repo) {
  repo = repo || GITHUB_REPO;
  try {
    var result = fetchGitHubApi('/repos/' + repo + '/contents/' + path, 'GET');
    return Utilities.newBlob(Utilities.base64Decode(result.content)).getDataAsString();
  } catch (e) { return null; }
}

function pushFileToGitHub(path, content, commitMessage, repo) {
  repo = repo || GITHUB_REPO;
  var mainRef = fetchGitHubApi('/repos/' + repo + '/git/ref/heads/main', 'GET');
  var branchName = 'storage-' + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd-HHmmss')
    + '-' + path.replace(/[\/\.]/g, '-').substring(0, 30);
  fetchGitHubApi('/repos/' + repo + '/git/refs', 'POST', {
    ref: 'refs/heads/' + branchName, sha: mainRef.object.sha
  });
  var existingSha = null;
  try {
    var existing = fetchGitHubApi('/repos/' + repo + '/contents/' + path + '?ref=' + branchName, 'GET');
    existingSha = existing.sha;
  } catch (e) {}
  var payload = {
    message: commitMessage + '\n\nCo-Authored-By: TokiStorage GAS <noreply@tokistorage.com>',
    content: Utilities.base64Encode(content, Utilities.Charset.UTF_8),
    branch: branchName
  };
  if (existingSha) payload.sha = existingSha;
  fetchGitHubApi('/repos/' + repo + '/contents/' + path, 'PUT', payload);
  fetchGitHubApi('/repos/' + repo + '/pulls', 'POST', {
    title: commitMessage, head: branchName, base: 'main',
    body: 'Automated update from GAS.\n\nPath: ' + path
  });
}
