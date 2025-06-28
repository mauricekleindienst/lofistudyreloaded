// Service Worker for enhanced video caching and CDN optimization
const CACHE_NAME = 'lofistudy-videos-v1';
const VIDEO_CACHE_NAME = 'lofistudy-videos-data-v1';

// List of high-priority videos to cache immediately
const HIGH_PRIORITY_VIDEOS = [
  '/backgrounds/Rain.mp4',
  '/backgrounds/Train.mp4',
  '/backgrounds/Classroom.mp4'
];

// Install event - cache high-priority videos
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache app shell
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll([
          '/',
          '/static/js/bundle.js',
          '/static/css/main.css'
        ]);
      }),
      // Optionally pre-cache critical videos (be careful with bandwidth)
      // caches.open(VIDEO_CACHE_NAME).then((cache) => {
      //   return cache.addAll(HIGH_PRIORITY_VIDEOS.map(video => 
      //     `https://lofistudy.fra1.cdn.digitaloceanspaces.com${video}`
      //   ));
      // })
    ]).then(() => {
      console.log('Service Worker: Installed successfully');
      self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches
          if (cacheName !== CACHE_NAME && cacheName !== VIDEO_CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated successfully');
      self.clients.claim();
    })
  );
});

// Fetch event - handle video requests with smart caching
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle video requests from Digital Ocean CDN
  if (url.hostname.includes('digitaloceanspaces.com') && url.pathname.includes('.mp4')) {
    event.respondWith(handleVideoRequest(event.request));
    return;
  }
  
  // Handle other requests with network-first strategy
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request);
      })
  );
});

// Enhanced video request handler with intelligent caching
async function handleVideoRequest(request) {
  const url = new URL(request.url);
  const isRangeRequest = request.headers.get('range');
  
  try {
    // For range requests (video seeking), always go to network
    if (isRangeRequest) {
      const networkResponse = await fetch(request);
      
      // Cache the full video in background if it's high priority
      if (isHighPriorityVideo(url.pathname)) {
        cacheFullVideo(url.href);
      }
      
      return networkResponse;
    }
    
    // Check cache first for full video requests
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('Service Worker: Serving video from cache:', url.pathname);
      return cachedResponse;
    }
    
    // Fetch from network
    const networkResponse = await fetch(request);
    
    // Cache successful responses (but be mindful of storage limits)
    if (networkResponse.status === 200 && networkResponse.headers.get('content-type')?.includes('video')) {
      const responseClone = networkResponse.clone();
      
      // Only cache smaller videos or high-priority ones
      const contentLength = networkResponse.headers.get('content-length');
      const videoSize = contentLength ? parseInt(contentLength, 10) : 0;
      
      if (videoSize < 50 * 1024 * 1024 || isHighPriorityVideo(url.pathname)) { // 50MB limit
        caches.open(VIDEO_CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
          console.log('Service Worker: Cached video:', url.pathname);
        });
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Error handling video request:', error);
    
    // Try to serve from cache as fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return error response
    return new Response('Video unavailable', { status: 503 });
  }
}

// Check if video is high priority
function isHighPriorityVideo(pathname) {
  return HIGH_PRIORITY_VIDEOS.some(video => pathname.includes(video));
}

// Background cache full video
async function cacheFullVideo(videoUrl) {
  try {
    const cache = await caches.open(VIDEO_CACHE_NAME);
    const response = await fetch(videoUrl);
    
    if (response.status === 200) {
      await cache.put(videoUrl, response);
      console.log('Service Worker: Background cached full video:', videoUrl);
    }
  } catch (error) {
    console.warn('Service Worker: Failed to background cache video:', error);
  }
}

// Message handling for cache management from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_VIDEO_CACHE') {
    event.waitUntil(
      caches.delete(VIDEO_CACHE_NAME).then(() => {
        console.log('Service Worker: Cleared video cache');
        event.ports[0].postMessage({ success: true });
      })
    );
  }
  
  if (event.data && event.data.type === 'PRELOAD_VIDEO') {
    const videoUrl = event.data.url;
    event.waitUntil(
      cacheFullVideo(videoUrl).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});
