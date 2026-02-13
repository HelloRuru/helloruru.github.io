/**
 * SEO Quest — 事件系統（Pub/Sub）
 */

const listeners = {};

export const Events = {
  on(event, callback) {
    if (!listeners[event]) listeners[event] = [];
    if (listeners[event].includes(callback)) return;
    listeners[event].push(callback);
  },

  off(event, callback) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(cb => cb !== callback);
  },

  offAll(event) {
    if (event) { delete listeners[event]; }
    else { Object.keys(listeners).forEach(k => delete listeners[k]); }
  },

  emit(event, data) {
    if (!listeners[event]) return;
    listeners[event].forEach(cb => {
      try { cb(data); }
      catch (err) { console.error(`[Events] Listener error on '${event}':`, err); }
    });
  },
};
