/**
 * PWA Service Worker - 提供離線功能和快取
 */

const CACHE_NAME = 'ai-business-platform-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// 安裝事件
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache).catch((error) => {
          console.warn('Some resources failed to cache:', error);
          // Continue even if some resources fail to cache
          return Promise.resolve();
        });
      })
  );
});

// 攔截請求
self.addEventListener('fetch', (event) => {
  // Skip non-HTTP(S) requests (chrome-extension, etc.)
  const url = new URL(event.request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 快取命中 - 返回快取版本
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          (response) => {
            // 檢查是否為有效回應
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 複製回應
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                // 再次檢查 URL 協議，避免快取非 HTTP(S) 請求
                const requestUrl = new URL(event.request.url);
                if (requestUrl.protocol === 'http:' || requestUrl.protocol === 'https:') {
                  cache.put(event.request, responseToCache);
                }
              })
              .catch((err) => {
                // Silently ignore cache errors
                console.warn('Cache put failed:', err);
              });

            return response;
          }
        ).catch((error) => {
          // Network error - return a basic response instead of throwing
          console.warn('Fetch failed for:', event.request.url, error);
          // Return a basic error response instead of throwing
          return new Response('Network error', { 
            status: 503, 
            statusText: 'Service Unavailable' 
          });
        });
      })
  );
});

// 更新事件
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 推送通知
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '您有新的通知',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '查看詳情',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: '關閉',
        icon: '/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('AI 商業平台', options)
  );
});

// 通知點擊事件
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
