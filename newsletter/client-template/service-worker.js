var CACHE = 'toki-nl-v1';
var SHELL = ['./', 'manifest.json', 'client-config.json'];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(SHELL); }).catch(function() {}));
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.filter(function(n) { return n !== CACHE; }).map(function(n) { return caches.delete(n); }));
    }).then(function() { return self.clients.claim(); })
  );
});

function isHTML(req, url) {
  return req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');
}
function isSchedule(url) {
  return url.pathname.endsWith('/schedule.json');
}
function isPDF(url) {
  return url.pathname.endsWith('.pdf');
}

function staleWhileRevalidate(req) {
  return caches.match(req).then(function(cached) {
    var fetchP = fetch(req).then(function(resp) {
      if (resp && resp.status === 200 && resp.type === 'basic') {
        caches.open(CACHE).then(function(c) { c.put(req, resp.clone()); });
      }
      return resp;
    }).catch(function() { return cached; });
    return cached || fetchP;
  });
}

function networkFirst(req) {
  return fetch(req).then(function(resp) {
    if (resp && resp.status === 200 && resp.type === 'basic') {
      caches.open(CACHE).then(function(c) { c.put(req, resp.clone()); });
    }
    return resp;
  }).catch(function() {
    return caches.match(req);
  });
}

function cacheFirst(req) {
  return caches.match(req).then(function(cached) {
    if (cached) return cached;
    return fetch(req).then(function(resp) {
      if (resp && resp.status === 200 && resp.type === 'basic') {
        caches.open(CACHE).then(function(c) { c.put(req, resp.clone()); });
      }
      return resp;
    });
  }).catch(function() { return caches.match('./'); });
}

self.addEventListener('fetch', function(e) {
  if (!e.request.url.startsWith('http')) return;
  var url = new URL(e.request.url);

  if (isSchedule(url)) {
    e.respondWith(networkFirst(e.request));
  } else if (isPDF(url)) {
    e.respondWith(cacheFirst(e.request));
  } else if (isHTML(e.request, url)) {
    e.respondWith(staleWhileRevalidate(e.request));
  } else {
    e.respondWith(cacheFirst(e.request));
  }
});
