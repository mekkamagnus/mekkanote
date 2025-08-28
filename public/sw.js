// Service Worker for MekkaNote PWA - Development Mode
const CACHE_NAME = 'mekkanote-v1.0.2';
const API_CACHE_NAME = 'mekkanote-api-v1.0.2';
const DEVELOPMENT_MODE = true; // Set to false for production

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/manifest.json',
  // External CDN assets
  'https://cdn.jsdelivr.net/npm/daisyui@4.4.0/dist/full.css',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/htmx.org@1.9.8'
];

// API routes to cache
const API_ROUTES = [
  '/api/ui/notes/list',
  '/api/ui/search',
  '/api/ui/folders',
  '/api/ui/settings'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS).catch((error) => {
          console.warn('Service Worker: Failed to cache some static assets:', error);
        });
      }),
      // Cache API routes
      caches.open(API_CACHE_NAME).then((cache) => {
        console.log('Service Worker: Pre-caching API routes');
        return Promise.allSettled(
          API_ROUTES.map(route => 
            fetch(route).then(response => {
              if (response.ok) {
                return cache.put(route, response.clone());
              }
            }).catch(error => {
              console.warn(`Service Worker: Failed to pre-cache ${route}:`, error);
            })
          )
        );
      })
    ]).then(() => {
      console.log('Service Worker: Installation complete');
      return self.skipWaiting();
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
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation complete');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/ui/')) {
    // API UI routes - network first, fallback to cache
    event.respondWith(handleAPIRequest(request));
  } else if (url.pathname.startsWith('/api/')) {
    // API data routes - network only (no caching for data)
    event.respondWith(handleDataAPIRequest(request));
  } else {
    // Static assets - cache first, fallback to network
    event.respondWith(handleStaticRequest(request));
  }
});

// Handle API UI requests (always network first)
async function handleAPIRequest(request) {
  try {
    // Always try network first for API UI routes
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // In development mode, don't cache API responses to always get fresh content
      if (!DEVELOPMENT_MODE) {
        const cache = await caches.open(API_CACHE_NAME);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache:', request.url);
    
    // Fallback to cache only in production mode
    if (!DEVELOPMENT_MODE) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Return offline page
    return createOfflineResponse(request);
  }
}

// Handle data API requests (network only)
async function handleDataAPIRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    console.log('Service Worker: Data API request failed:', request.url);
    
    // Return error response for data APIs
    return new Response(
      JSON.stringify({ error: 'Network unavailable', offline: true }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static requests (network first in dev mode, cache first in production)
async function handleStaticRequest(request) {
  if (DEVELOPMENT_MODE) {
    // Development: Network first to get latest changes
    try {
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        // Update cache with fresh content
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        return networkResponse;
      }
      
      throw new Error('Network response not ok');
    } catch (error) {
      console.log('Service Worker: Network failed, trying cache:', request.url);
      
      // Fallback to cache
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Return offline fallback
      if (request.destination === 'document') {
        return new Response('<!DOCTYPE html><html><body><h1>Offline</h1><p>Please check your connection</p></body></html>', {
          headers: { 'Content-Type': 'text/html' }
        });
      }
      
      return new Response('Offline', { status: 503 });
    }
  } else {
    // Production: Cache first for performance
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    try {
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        return networkResponse;
      }
      
      throw new Error('Network response not ok');
    } catch (error) {
      console.log('Service Worker: Failed to fetch static asset:', request.url);
      
      if (request.destination === 'document') {
        return caches.match('/index.html');
      }
      
      return new Response('Offline', { status: 503 });
    }
  }
}

// Create offline response for UI requests
function createOfflineResponse(request) {
  const url = new URL(request.url);
  
  if (url.pathname === '/api/ui/notes/list') {
    return new Response(`
      <div class="error-container">
        <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.196l3.536 3.536M12 16.268l3.536 3.536M12 2.196L8.464 5.732M12 16.268L8.464 12.732"></path>
        </svg>
        <h3 class="error-title">You're offline</h3>
        <p class="error-message">Your notes will be available when you're back online.</p>
        <button class="btn btn-primary" onclick="window.location.reload()">Retry</button>
      </div>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  return new Response(`
    <div class="error-container">
      <h3 class="error-title">Offline</h3>
      <p class="error-message">This feature requires an internet connection.</p>
      <button class="btn btn-primary" onclick="window.location.reload()">Retry</button>
    </div>
  `, {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
}

// Handle background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'note-save') {
    event.waitUntil(syncNoteSaves());
  }
});

// Sync pending note saves
async function syncNoteSaves() {
  try {
    // Get pending saves from IndexedDB
    const pendingSaves = await getPendingSaves();
    
    for (const save of pendingSaves) {
      try {
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(save.data)
        });
        
        if (response.ok) {
          await removePendingSave(save.id);
          console.log('Service Worker: Synced note save:', save.id);
        }
      } catch (error) {
        console.warn('Service Worker: Failed to sync note save:', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Sync failed:', error);
  }
}

// IndexedDB helpers for offline functionality
async function getPendingSaves() {
  // This would integrate with IndexedDB in a real implementation
  return [];
}

async function removePendingSave(id) {
  // This would remove from IndexedDB in a real implementation
  console.log('Service Worker: Would remove pending save:', id);
}

// Handle push notifications (future feature)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'mekkanote-notification',
    requireInteraction: false
  };
  
  event.waitUntil(
    self.registration.showNotification('MekkaNote', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // If app is already open, focus it
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Otherwise, open the app
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

console.log('Service Worker: Script loaded');