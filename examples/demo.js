// Демонстрація всіх лабораторних робіт, вбудованих у CoachLab.
// Запуск: npm run demo

const { colorCycle, incrementalCounter, fibonacci, consumeWithTimeout } = require("../lib/generators");
const { memoize } = require("../lib/memoize");
const { BiPriorityQueue } = require("../lib/priorityQueue");
const { asyncMapCallback, asyncMap } = require("../lib/asyncArray");
const { recordSource, processStream } = require("../lib/streamProcess");
const { EventBus } = require("../lib/events");
const { createAuthProxy } = require("../lib/authProxy");
const { log, setLevel } = require("../lib/logger");

function title(t) {
  console.log("\n========== " + t + " ==========");
}

async function main() {
  // ---- Лаб 1: генератори та ітератор з таймаутом ----
  title("Лаб 1: генератори");
  const counter = incrementalCounter(10);
  console.log("Лічильник:", consumeWithTimeout(counter, 0.05, (v) => v).slice(0, 5));
  const colors = colorCycle(["red", "green", "blue"]);
  console.log("Кольори (циклічно):", [colors.next().value, colors.next().value, colors.next().value, colors.next().value]);
  const fib = fibonacci();
  console.log("Фібоначчі:", Array.from({ length: 8 }, () => fib.next().value));

  // ---- Лаб 3: мемоізація з LRU ----
  title("Лаб 3: мемоізація (LRU, maxSize=2)");
  let calls = 0;
  const slowSquare = memoize((n) => { calls++; return n * n; }, { policy: "LRU", maxSize: 2 });
  console.log(slowSquare(2), slowSquare(2), slowSquare(3), slowSquare(4), slowSquare(2));
  console.log("Реальних обчислень:", calls, "(2 кешувалось, потім витіснилось)");

  // ---- Лаб 4: двостороння черга з пріоритетами ----
  title("Лаб 4: черга з пріоритетами");
  const pq = new BiPriorityQueue();
  pq.enqueue("низький", 1).enqueue("високий", 10).enqueue("середній", 5);
  console.log("найвищий:", pq.peek("highest"), "| найнижчий:", pq.peek("lowest"));
  console.log("найстаріший:", pq.peek("oldest"), "| найновіший:", pq.peek("newest"));

  // ---- Лаб 5: async-map (callback + promise + abort) ----
  title("Лаб 5: async-map");
  asyncMapCallback([1, 2, 3], (x, i, cb) => cb(null, x * 10), (err, res) =>
    console.log("callback-версія:", res)
  );
  const promiseRes = await asyncMap([1, 2, 3], async (x) => x + 100);
  console.log("promise-версія:", promiseRes);
  const ac = new AbortController();
  ac.abort();
  try {
    await asyncMap([1, 2], async (x) => x, { signal: ac.signal });
  } catch (e) {
    console.log("скасування:", e.message);
  }

  // ---- Лаб 6: обробка потоку даних async-ітератором ----
  title("Лаб 6: стрім великих даних");
  const stats = await processStream(recordSource(1000, 100));
  console.log("Оброблено записів:", stats.count, "| середнє:", stats.avg.toFixed(3));

  // ---- Лаб 7: події (кілька незалежних слухачів) ----
  title("Лаб 7: EventEmitter");
  const bus = new EventBus();
  const off1 = bus.on("msg", (p) => console.log("слухач A отримав:", p));
  bus.on("msg", (p) => console.log("слухач B отримав:", p));
  bus.emit("msg", "привіт");
  off1(); // відписка
  bus.emit("msg", "тільки B почує це");

  // ---- Лаб 8: auth-проксі (підставляння токена) ----
  title("Лаб 8: auth-проксі");
  const fakeRequest = (url, options) => ({ url, headers: options.headers });
  const proxied = createAuthProxy(fakeRequest, { strategy: "jwt", token: "secret123" });
  console.log("запит із токеном:", proxied("/api/data"));

  // ---- Лаб 9: логуючий декоратор ----
  title("Лаб 9: логуючий декоратор");
  setLevel("INFO");
  const add = log((a, b) => a + b, { level: "INFO", name: "add" });
  add(2, 3);
}

main();
