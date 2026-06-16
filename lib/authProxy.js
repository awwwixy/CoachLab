// Лабораторна 8: проксі автентифікації для HTTP-запитів.
// Обгортає функцію запиту (fetch-подібну) і підставляє облікові дані
// перед відправкою. Підтримує різні стратегії: API Key, JWT, OAuth.

function createAuthProxy(requestFn, config = {}) {
  // config: { strategy: "apikey"|"jwt"|"oauth", token, headerName, getToken }
  let { strategy = "jwt", token = null, headerName, getToken } = config;

  function authHeaders() {
    const value = getToken ? getToken() : token;
    if (!value) return {};
    if (strategy === "apikey") return { [headerName || "X-API-Key"]: value };
    if (strategy === "oauth" || strategy === "jwt") {
      return { Authorization: "Bearer " + value };
    }
    return {};
  }

  // Обгорнутий запит: доклеює заголовки автентифікації
  const proxied = function (url, options = {}) {
    const merged = {
      ...options,
      headers: { ...(options.headers || {}), ...authHeaders() },
    };
    return requestFn(url, merged);
  };

  // Динамічне перемикання стратегії/токена
  proxied.setToken = (t) => { token = t; };
  proxied.setStrategy = (s) => { strategy = s; };
  return proxied;
}

module.exports = { createAuthProxy };
