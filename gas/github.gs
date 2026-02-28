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

/**
 * 複数ファイルを1コミットで一括追加 (Git Trees API)
 * commitFileOnBranch の連続呼び出しによる帯域制限を回避
 *
 * @param {Array<{path:string, content:string}>} files - ファイル一覧
 * @param {string} message - コミットメッセージ
 * @param {string} branch - ブランチ名
 * @param {string} repo - リポジトリ (owner/name)
 */
function batchCommitFiles(files, message, branch, repo) {
  repo = repo || GITHUB_REPO;
  branch = branch || 'main';

  // 1. 現在のコミットSHA取得
  var ref = fetchGitHubApi('/repos/' + repo + '/git/ref/heads/' + branch, 'GET');
  var commitSha = ref.object.sha;

  // 2. 現在のツリーSHA取得
  var commit = fetchGitHubApi('/repos/' + repo + '/git/commits/' + commitSha, 'GET');
  var baseSha = commit.tree.sha;

  // 3. 全ファイルを含む新ツリー作成
  var treeItems = [];
  for (var i = 0; i < files.length; i++) {
    treeItems.push({
      path: files[i].path,
      mode: '100644',
      type: 'blob',
      content: files[i].content
    });
  }
  var newTree = fetchGitHubApi('/repos/' + repo + '/git/trees', 'POST', {
    base_tree: baseSha,
    tree: treeItems
  });

  // 4. コミット作成
  var newCommit = fetchGitHubApi('/repos/' + repo + '/git/commits', 'POST', {
    message: message + '\n\nCo-Authored-By: TokiStorage GAS <noreply@tokistorage.com>',
    tree: newTree.sha,
    parents: [commitSha]
  });

  // 5. ref更新
  fetchGitHubApi('/repos/' + repo + '/git/refs/heads/' + branch, 'PATCH', {
    sha: newCommit.sha
  });
}

/**
 * バイナリファイルの base64 コンテンツを取得（デコードせず返す）
 */
function readBinaryFromGitHub(path, repo) {
  repo = repo || GITHUB_REPO;
  try {
    var result = fetchGitHubApi('/repos/' + repo + '/contents/' + path, 'GET');
    return result.content ? result.content.replace(/\n/g, '') : null;
  } catch (e) { return null; }
}

/**
 * ブランチ上のファイルを削除（Contents API DELETE）
 */
function deleteFileOnBranch(path, branch, repo) {
  repo = repo || GITHUB_REPO;
  var existing = fetchGitHubApi('/repos/' + repo + '/contents/' + path + '?ref=' + branch, 'GET');
  fetchGitHubApi('/repos/' + repo + '/contents/' + path, 'DELETE', {
    message: 'Remove processed queue file: ' + path + '\n\nCo-Authored-By: TokiStorage GAS <noreply@tokistorage.com>',
    sha: existing.sha,
    branch: branch
  });
}

/**
 * queue/ ディレクトリのファイル一覧取得（Contents API GET on directory）
 */
function listQueueEntries() {
  try {
    var result = fetchGitHubApi('/repos/' + NEWSLETTER_MASTER + '/contents/queue', 'GET');
    if (!Array.isArray(result)) return [];
    return result.filter(function(f) { return f.name !== '.gitkeep'; });
  } catch (e) { return []; }
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
