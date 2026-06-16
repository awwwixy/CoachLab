// Лабораторна 1: генератори та ітератори

// Нескінченний генератор: циклічно видає кольори (Color Cycle)
function* colorCycle(colors = ["red", "green", "blue"]) {
  let i = 0;
  while (true) {
    yield colors[i % colors.length];
    i++;
  }
}

// Нескінченний генератор: лічильник, що зростає від start
function* incrementalCounter(start = 1) {
  let n = start;
  while (true) {
    yield n;
    n++;
  }
}

// Нескінченний генератор: послідовність Фібоначчі
function* fibonacci() {
  let a = 0, b = 1;
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

// Ітератор з таймаутом: споживає ітератор протягом seconds секунд,
// викликаючи process(value, index) на кожному значенні.
function consumeWithTimeout(iterator, seconds, process) {
  const end = Date.now() + seconds * 1000;
  let index = 0;
  const results = [];
  while (Date.now() < end) {
    const next = iterator.next();
    if (next.done) break;
    results.push(process ? process(next.value, index) : next.value);
    index++;
  }
  return results;
}

module.exports = { colorCycle, incrementalCounter, fibonacci, consumeWithTimeout };
