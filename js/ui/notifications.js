const notificationEvents = new EventTarget();

export function notify(message, type = '') {
  notificationEvents.dispatchEvent(
    new CustomEvent('notification', { detail: { message, type } }),
  );
}

export function subscribeToNotifications(handler) {
  const listener = (event) => handler(event.detail);
  notificationEvents.addEventListener('notification', listener);

  return () => notificationEvents.removeEventListener('notification', listener);
}
