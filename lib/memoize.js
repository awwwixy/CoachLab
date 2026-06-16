// Лабораторна 3: мемоізація з налаштовуваною стратегією витіснення

// Обгортає чисту функцію fn, кешуючи результати за аргументами.
// options:
//   maxSize  - максимальний розмір кешу (за замовч. без обмеження)
//   policy   - "LRU" | "LFU" | "TTL" | "custom"
//   ttl      - час життя запису в мс (для policy "TTL")
//   evict    - власна функція витіснення (для policy "custom"),
//              отримує Map записів і має повернути ключ для видалення
function memoize(fn, options = {}) {
  const { maxSize = Infinity, policy = "LRU", ttl = 0, evict } = options;
  const cache = new Map(); // key -> { value, hits, time }

  function keyOf(args) {
    return JSON.stringify(args);
  }

  function expired(entry) {
    return policy === "TTL" && ttl > 0 && Date.now() - entry.time > ttl;
  }

  function pickEvictKey() {
    if (policy === "custom" && evict) return evict(cache);
    if (policy === "LFU") {
      let minKey, minHits = Infinity;
      for (const [k, e] of cache) {
        if (e.hits < minHits) { minHits = e.hits; minKey = k; }
      }
      return minKey;
    }
    // LRU / TTL / за замовчуванням — найстаріший доданий (перший у Map)
    return cache.keys().next().value;
  }

  const memoized = function (...args) {
    const key = keyOf(args);
    const hit = cache.get(key);

    if (hit && !expired(hit)) {
      hit.hits++;
      if (policy === "LRU") { // оновлюємо «свіжість»: переставляємо в кінець
        cache.delete(key);
        cache.set(key, hit);
      }
      return hit.value;
    }
    if (hit) cache.delete(key); // протермінований — прибираємо

    const value = fn.apply(this, args);
    cache.set(key, { value, hits: 1, time: Date.now() });

    while (cache.size > maxSize) {
      cache.delete(pickEvictKey());
    }
    return value;
  };

  memoized.cache = cache;
  return memoized;
}

module.exports = { memoize };
