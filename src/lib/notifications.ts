const DAILY_PHRASES = [
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

export function getRandomDailyPhrase(): string {
  return DAILY_PHRASES[Math.floor(Math.random() * DAILY_PHRASES.length)];
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  } catch (err) {
    console.error('SW registration failed:', err);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export async function sendLocalNotification(title: string, body: string, tag?: string) {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return;

  const registration = await navigator.serviceWorker?.ready;
  if (registration) {
    await registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      tag: tag || 'pilar-general',
    } as NotificationOptions);
  } else {
    // Fallback to basic Notification API
    new Notification(title, { body, icon: '/icon-192.png', tag: tag || 'pilar-general' });
  }
}

export function scheduleDailyNotification(hour: number, minute: number) {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  
  const delay = target.getTime() - now.getTime();
  
  setTimeout(() => {
    sendLocalNotification('Pilar 💛', getRandomDailyPhrase(), 'daily-pilar');
    // Reschedule for next day
    scheduleDailyNotification(hour, minute);
  }, delay);
}

export function scheduleHabitReminder(reviewTime: string) {
  const [h, m] = reviewTime.split(':').map(Number);
  scheduleDailyNotification(h, m);
}
