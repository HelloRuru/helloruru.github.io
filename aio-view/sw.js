/* ================================================
   AIO View — Service Worker (PWA 離線快取)
   ================================================ */

const CACHE_NAME = 'aio-view-v2.1';
const ASSETS = [
  '/aio-view/',
  '/aio-view/index.html',
  '/aio-view/style.css',
  '/aio-view/css/base.css',
  '/aio-view/css/layout.css',
  '/aio-view/css/typography.css',
  '/aio-view/css/responsive.css',
  '/aio-view/css/components/header.css',
  '/aio-view/css/components/card.css',
  '/aio-view/css/components/badges.css',
  '/aio-view/css/components/input.css',
  '/aio-view/css/components/buttons.css',
  '/aio-view/css/components/table.css',
  '/aio-view/css/components/stats.css',
  '/aio-view/css/components/code-block.css',
  '/aio-view/css/components/actions.css',
  '/aio-view/css/components/toast.css',
  '/aio-view/css/components/loading.css',
  '/aio-view/css/components/footer.css',
  '/aio-view/css/components/empty-state.css',
  '/aio-view/css/components/guide.css',
  '/aio-view/css/components/modal.css',
  '/aio-view/css/components/ai-assist.css',
  '/aio-view/css/components/charts.css',
  '/aio-view/css/components/timeline.css',
  '/aio-view/css/components/manual-check.css',
  '/aio-view/js/modules/utils.js',
  '/aio-view/js/modules/toast.js',
  '/aio-view/js/modules/storage.js',
  '/aio-view/js/modules/query-engine.js',
  '/aio-view/js/modules/sitemap.js',
  '/aio-view/js/modules/db.js',
  '/aio-view/js/components/guide.js',
  '/aio-view/js/components/stats.js',
  '/aio-view/js/components/articles-table.js',
  '/aio-view/js/components/results-table.js',
  '/aio-view/js/components/file-upload.js',
  '/aio-view/js/components/cli-generator.js',
  '/aio-view/js/components/sitemap-input.js',
  '/aio-view/js/components/ai-assist.js',
  '/aio-view/js/components/manual-check.js',
  '/aio-view/js/components/charts.js',
  '/aio-view/js/components/search-insights.js',
  '/aio-view/js/components/timeline.js',
  '/aio-view/js/main.js',
  '/aio-view/icons/favicon.svg',
  '/aio-view/icons/icon-192.svg',
  '/aio-view/icons/icon-512.svg',
  '/aio-view/manifest.json'
];

// 安裝：快取核心檔案
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 啟動：清除舊版快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// 攔截請求：網路優先，失敗用快取
self.addEventListener('fetch', (event) => {
  // 跳過非 GET 和外部 API
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // 外部資源（CDN、Google API）不快取
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 成功就更新快取
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        // 離線時用快取
        return caches.match(event.request);
      })
  );
});
