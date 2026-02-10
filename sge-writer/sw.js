/**
 * SGE 文案助手 - Service Worker
 * 提供離線功能與快取管理
 */

const CACHE_NAME = 'sge-writer-v7';
const STATIC_ASSETS = [
  '/sge-writer/',
  '/sge-writer/index.html',
  '/sge-writer/manifest.json',
  '/sge-writer/icons/favicon.svg',
  '/sge-writer/icons/favicon-32x32.png',
  '/sge-writer/icons/apple-touch-icon.png',
  '/sge-writer/icons/android-chrome-192x192.png',
  '/sge-writer/icons/android-chrome-512x512.png',
  // CSS 模組
  '/sge-writer/css/base.css',
  '/sge-writer/css/layout.css',
  '/sge-writer/css/accessibility.css',
  '/sge-writer/css/responsive.css',
  '/sge-writer/css/utilities.css',
  '/sge-writer/css/components/buttons.css',
  '/sge-writer/css/components/cards.css',
  '/sge-writer/css/components/adventure-map.css',
  '/sge-writer/css/components/party.css',
  '/sge-writer/css/components/dialog.css',
  '/sge-writer/css/components/quest-form.css',
  '/sge-writer/css/components/quick-input.css',
  '/sge-writer/css/components/strategy.css',
  '/sge-writer/css/components/fact-check.css',
  '/sge-writer/css/components/quick-commands.css',
  '/sge-writer/css/components/level.css',
  '/sge-writer/css/components/mobile-tabs.css',
  '/sge-writer/css/components/editor.css',
  '/sge-writer/css/components/analysis.css',
  '/sge-writer/css/components/modal.css',
  '/sge-writer/css/components/toast.css',
  '/sge-writer/css/components/animations.css',
  '/sge-writer/css/components/portrait-showcase.css',
  '/sge-writer/css/components/opening.css',
  '/sge-writer/css/components/level-dialog.css',
  '/sge-writer/css/components/zhiyu-police.css',
  // JS 模組
  '/sge-writer/js/app.js',
  '/sge-writer/js/editor.js',
  '/sge-writer/js/storage.js',
  '/sge-writer/js/templates.js',
  '/sge-writer/js/image-storage.js',
  '/sge-writer/js/seo-analyzer.js',
  '/sge-writer/js/features/portrait-director.js',
  '/sge-writer/js/features/opening.js',
  '/sge-writer/js/features/level-dialogs.js'
];

// 外部資源（字體等）
const EXTERNAL_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap'
];

/**
 * Install Event
 * 預快取靜態資源
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Install complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Install failed:', error);
      })
  );
});

/**
 * Activate Event
 * 清理舊快取
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activate complete');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch Event
 * 網路優先，失敗時使用快取
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只處理 GET 請求
  if (request.method !== 'GET') {
    return;
  }

  // 跳過 chrome-extension 等非 http(s) 請求
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 對於 HTML 頁面，使用網路優先策略
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }

  // 對於靜態資源，使用快取優先策略
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 其他請求使用網路優先
  event.respondWith(networkFirst(request));
});

/**
 * 快取優先策略
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // 背景更新快取
    updateCache(request);
    return cachedResponse;
  }

  return fetchAndCache(request);
}

/**
 * 網路優先策略
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    // 成功取得網路回應，更新快取
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // 網路失敗，嘗試使用快取
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // 如果是導航請求，返回離線頁面
    if (request.mode === 'navigate') {
      return caches.match('/sge-writer/index.html');
    }

    throw error;
  }
}

/**
 * 取得並快取
 */
async function fetchAndCache(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    throw error;
  }
}

/**
 * 背景更新快取
 */
async function updateCache(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    // 背景更新失敗，忽略錯誤
  }
}

/**
 * 判斷是否為靜態資源
 */
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

/**
 * 訊息處理
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache cleared');
    });
  }
});
