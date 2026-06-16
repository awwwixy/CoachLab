function* colorCycle(colors = ["red", "green", "blue"]) {
  let i = 0;
  while (true) {
    yield colors[i % colors.length];
    i++;
  }
}

function* incrementalCounter(start = 1) {
  let n = start;
  while (true) {
    yield n;
    n++;
  }
}

function* fibonacci() {
  let a = 0, b = 1;
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}

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
