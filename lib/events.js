// Лабораторна 7: реактивна комунікація через події (EventEmitter)
// Кілька слухачів можуть незалежно реагувати на одну подію.
// Підтримує subscribe/unsubscribe.

class EventBus {
  constructor() {
    this.listeners = new Map(); // event -> Set(callback)
  }

  // Підписка. Повертає функцію відписки.
  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    const set = this.listeners.get(event);
    if (set) set.delete(callback);
  }

  emit(event, payload) {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const cb of set) {
      try {
        cb(payload);
      } catch (e) {
        // один слухач, що впав, не має ламати інших
      }
    }
  }
}

module.exports = { EventBus };
