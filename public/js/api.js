async function apiRequest(method, url, data) {
  const options = { method: method, headers: { "Content-Type": "application/json" } };
  if (data) options.body = JSON.stringify(data);

  const response = await fetch(url, options);
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
