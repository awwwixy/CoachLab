// Лабораторна 6: обробка великих наборів даних через async-ітератор
// Дані віддаються порціями (chunk) і обробляються по одному запису,
// без завантаження всього набору в пам'ять одразу.

// Async-генератор: «нескінченне» джерело записів, що видаються партіями.
async function* recordSource(total, batchSize = 100) {
  let produced = 0;
  while (produced < total) {
    const batch = [];
    for (let i = 0; i < batchSize && produced < total; i++) {
      batch.push({ id: produced, value: Math.random() });
      produced++;
    }
    // імітація очікування наступної партії (мережа/диск)
    await new Promise((r) => setTimeout(r, 0));
    for (const record of batch) yield record;
  }
}

// Споживає async-ітерабельне джерело й рахує агрегати,
// тримаючи в пам'яті лише поточний запис і running-суму.
async function processStream(source, onRecord) {
  let count = 0;
  let sum = 0;
  for await (const record of source) {
    count++;
    sum += record.value;
    if (onRecord) onRecord(record, { count, sum });
  }
  return { count, sum, avg: count ? sum / count : 0 };
}

module.exports = { recordSource, processStream };
