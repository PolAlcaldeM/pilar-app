const CACHE_NAME = 'pilar-v1';

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push notification event
self.addEventListener('push', (event) => {
  let data = { title: 'Pilar 💛', body: 'Hoy cuenta. Registra tu día y construid algo más fuerte juntos.' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: data.url || '/',
    actions: data.actions || [],
    tag: data.tag || 'pilar-notification',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// Periodic sync for daily notifications (when supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-pilar') {
    event.waitUntil(showDailyNotification());
  }
});

async function showDailyNotification() {
  const phrases = [
    'Hoy cuenta 💛 Registra tu día y construid algo más fuerte juntos.',
    'Cada pequeño gesto suma. ¿Cómo quieres cuidar tu relación hoy?',
    'El amor se construye con constancia. Hoy es un buen día para demostrarlo.',
    'Tu pareja merece lo mejor de ti. Empieza por ser consciente hoy.',
    'Las parejas que crecen juntas, permanecen juntas. 🌱',
    'Un día a la vez. Hoy puede ser el mejor de la semana.',
    'La comunicación es el puente entre dos corazones. Cruza el tuyo hoy.',
    'No se trata de ser perfectos, sino de ser constantes. 💛',
    'Hoy es una nueva oportunidad para ser la pareja que quieres ser.',
    'Pequeños hábitos, grandes transformaciones. Empieza ahora.',
  ];
  
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];
  
  await self.registration.showNotification('Pilar 💛', {
    body: phrase,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    tag: 'daily-pilar',
    renotify: true,
    data: '/home',
  });
}
