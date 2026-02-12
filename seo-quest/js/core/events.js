/**
 * SEO Quest — 事件系統（Pub/Sub）
 */

const listeners = {};

export const Events = {
  on(event, callback) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
  },

  off(event, callback) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(cb => cb !== callback);
  },

  emit(event, data) {
    if (!listeners[event]) return;
    listeners[event].forEach(cb => cb(data));
  },
};
