var CACHE = 'p5letka-journal-v3-v2';
var ASSETS = ['./', './index.html', './manifest.json', './icon.svg', './apple-touch-icon.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS)}));
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  // Не кешируем запросы не нашего origin (Firebase и т.д.)
  var url = new URL(e.request.url);
  if(url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request).then(function(r){
      if(r && r.status === 200 && r.type === 'basic'){
        var copy = r.clone();
        caches.open(CACHE).then(function(c){
          c.put(e.request, copy).catch(function(){});
        });
      }
      return r;
    }).catch(function(){
      return caches.match(e.request);
    })
  );
});
