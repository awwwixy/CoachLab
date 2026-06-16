function createAuthProxy(requestFn, config = {}) {

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

  const proxied = function (url, options = {}) {
    const merged = {
      ...options,
      headers: { ...(options.headers || {}), ...authHeaders() },
    };
    return requestFn(url, merged);
  };

  proxied.setToken = (t) => { token = t; };
  proxied.setStrategy = (s) => { strategy = s; };
  return proxied;
}

module.exports = { createAuthProxy };
