var CACHE = 'p5letka-journal-v3-v3';
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

  // Навигация (открытие страницы / запуск PWA): network-first,
  // но НИКОГДА не возвращаем null — иначе Safari показывает
  // "FetchEvent.respondWith received an error: Returned response is null"
  if(e.request.mode === 'navigate'){
    e.respondWith(
      fetch(e.request).then(function(r){
        if(r && r.status === 200){
          var copy = r.clone();
          caches.open(CACHE).then(function(c){
            c.put('./index.html', copy).catch(function(){});
          });
        }
        return r;
      }).catch(function(){
        return caches.match('./index.html').then(function(m){
          if(m) return m;
          return caches.match('./').then(function(m2){
            return m2 || new Response('<h1>Нет соединения</h1><p>Откройте журнал когда появится интернет.</p>', {status: 503, headers: {'Content-Type': 'text/html; charset=utf-8'}});
          });
        });
      })
    );
    return;
  }

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
      return caches.match(e.request).then(function(m){
        return m || new Response('', {status: 504, statusText: 'offline'});
      });
    })
  );
});
