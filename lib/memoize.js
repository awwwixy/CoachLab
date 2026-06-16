function memoize(fn, options = {}) {
  const { maxSize = Infinity, policy = "LRU", ttl = 0, evict } = options;
  const cache = new Map();

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

    return cache.keys().next().value;
  }

  const memoized = function (...args) {
    const key = keyOf(args);
    const hit = cache.get(key);

    if (hit && !expired(hit)) {
      hit.hits++;
      if (policy === "LRU") {
        cache.delete(key);
        cache.set(key, hit);
      }
      return hit.value;
    }
    if (hit) cache.delete(key);

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
