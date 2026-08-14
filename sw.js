const CACHE_NAME = 'fortune-app-v2';
const ASSETS = [
  './',
  './index.html',
  './data.js',
  './advice.js',
  './app.js',
  './ui.js',
  './manifest.json',
  './icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 네트워크 우선 전략: 항상 최신 파일을 먼저 시도하고, 오프라인일 때만 캐시를 사용한다.
// (이전 버전은 캐시를 먼저 서빙해서, 파일을 새로 배포해도 예전 화면이 계속 보이는 문제가 있었음)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
