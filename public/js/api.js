// Лаб 8: проксі автентифікації — обгортка над fetch, що підставляє
// токен поточної сесії у заголовок Authorization перед кожним запитом.
function createAuthProxy(requestFn, getToken) {
  return function (url, options = {}) {
    const token = getToken();
    const headers = { ...(options.headers || {}) };
    if (token) headers["Authorization"] = "Bearer " + token;
    return requestFn(url, { ...options, headers });
  };
}

const authFetch = createAuthProxy(
  (url, options) => fetch(url, options),
  () => {
    const s = getSession();
    return s ? String(s.id) : null;
  }
);

async function apiRequest(method, url, data) {
  const options = { method: method, headers: { "Content-Type": "application/json" } };
  if (data) options.body = JSON.stringify(data);

  const response = await authFetch(url, options);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Сталася помилка. Спробуй ще раз.");
  }
  return result;
}

function saveSession(user) {
  localStorage.setItem("coachlab_user", JSON.stringify({ id: user.id, name: user.name }));
}

function getSession() {
  const raw = localStorage.getItem("coachlab_user");
  return raw ? JSON.parse(raw) : null;
}

function clearSession() {
  localStorage.removeItem("coachlab_user");
}
