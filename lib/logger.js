// Лабораторна 9: логуючий декоратор з налаштовуваними рівнями.
// Обгортає будь-яку функцію (sync або async), логуючи аргументи,
// результат, час виконання й мітку часу.

const LEVELS = { ERROR: 0, INFO: 1, DEBUG: 2 };

// Поточний поріг: повідомлення нижчого рівня деталізації пропускаються.
let threshold = LEVELS.INFO;
function setLevel(level) {
  threshold = LEVELS[level] ?? LEVELS.INFO;
}

function write(level, entry) {
  if (LEVELS[level] > threshold && level !== "ERROR") return;
  const line = { time: new Date().toISOString(), level, ...entry };
  const text = `[${line.time}] ${level} ${line.name}: ${JSON.stringify(line)}`;
  if (level === "ERROR") console.error(text);
  else console.log(text);
}

// Декоратор. log(fn, { level, name }) -> обгорнута функція.
function log(fn, { level = "INFO", name = fn.name || "fn" } = {}) {
  return function (...args) {
    const started = Date.now();
    try {
      const result = fn.apply(this, args);
      // підтримка async-функцій
      if (result && typeof result.then === "function") {
        return result.then(
          (value) => {
            write(level, { name, args, result: value, ms: Date.now() - started });
            return value;
          },
          (err) => {
            write("ERROR", { name, args, error: err.message, ms: Date.now() - started });
            throw err;
          }
        );
      }
      write(level, { name, args, result, ms: Date.now() - started });
      return result;
    } catch (err) {
      write("ERROR", { name, args, error: err.message, ms: Date.now() - started });
      throw err;
    }
  };
}

module.exports = { log, setLevel, LEVELS };
