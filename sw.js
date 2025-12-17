const CACHE_NAME = 'camera-pwa-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/css/camera.css',
  '/css/overlay.css',
  '/css/ui-components.css',
  '/css/animations.css',
  '/js/app/main.js',
  '/js/camera/camera-controller.js',
  '/js/camera/camera-stream.js',
  '/js/camera/photo-capture.js',
  '/js/camera/camera-switch.js',
  '/js/overlay/overlay-manager.js',
  '/js/overlay/overlay-renderer.js',
  '/js/overlay/overlay-storage.js',
  '/js/overlay/overlay-upload.js',
  '/js/overlay/builtin-overlays.js',
  '/js/overlay/overlay-scaling.js',
  '/js/ui/ui-controller.js',
  '/js/ui/menu-controller.js',
  '/js/ui/shutter-button.js',
  '/js/ui/aspect-ratio-ui.js',
  '/js/ui/orientation.js',
  '/js/ui/vibration.js',
  '/js/utils/storage.js',
  '/js/utils/file-utils.js',
  '/js/utils/canvas-utils.js',
  '/js/utils/device-utils.js',
  '/js/utils/safe-area.js',
  '/overlays/rule-of-thirds.png',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip camera stream requests
  if (event.request.url.includes('blob:')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response if found
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the new response
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
      .catch(() => {
        // If both cache and network fail, show offline page
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
      })
  );
});