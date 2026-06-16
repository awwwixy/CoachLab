function asyncMapCallback(array, iteratee, done) {
  const result = [];
  let i = 0;
  function step() {
    if (i >= array.length) return done(null, result);
    const index = i++;
    iteratee(array[index], index, (err, value) => {
      if (err) return done(err);
      result[index] = value;
      step();
    });
  }
  step();
}

function asyncMap(array, asyncIteratee, { signal } = {}) {
  return new Promise(async (resolve, reject) => {
    if (signal && signal.aborted) return reject(new Error("Aborted"));
    const onAbort = () => reject(new Error("Aborted"));
    if (signal) signal.addEventListener("abort", onAbort);

    const result = [];
    try {
      for (let i = 0; i < array.length; i++) {
        if (signal && signal.aborted) throw new Error("Aborted");
        result[i] = await asyncIteratee(array[i], i);
      }
      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      if (signal) signal.removeEventListener("abort", onAbort);
    }
  });
}

module.exports = { asyncMapCallback, asyncMap };
