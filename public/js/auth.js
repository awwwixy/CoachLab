const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const nameField = document.getElementById("nameField");
const formTitle = document.getElementById("formTitle");
const formSub = document.getElementById("formSub");
const submitBtn = document.getElementById("submitBtn");
const msg = document.getElementById("msg");

let mode = "login";

if (getSession()) {
  window.location.href = "dashboard.html";
}

if (window.location.hash === "#register") {
  setMode("register");
}

tabLogin.addEventListener("click", () => setMode("login"));
tabRegister.addEventListener("click", () => setMode("register"));

function setMode(newMode) {
  mode = newMode;
  msg.textContent = "";
  msg.className = "form-msg";

  if (mode === "register") {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    nameField.hidden = false;
    formTitle.textContent = "Реєстрація";
    formSub.textContent = "Створи акаунт, щоб почати навчання.";
    submitBtn.textContent = "Зареєструватися";
  } else {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    nameField.hidden = true;
    formTitle.textContent = "Вхід в акаунт";
    formSub.textContent = "Увійди, щоб продовжити навчання.";
    submitBtn.textContent = "Увійти";
  }
}

submitBtn.addEventListener("click", async () => {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password || (mode === "register" && !name)) {
    return showError("Будь ласка, заповни всі поля.");
  }

  try {
    submitBtn.disabled = true;
    let result;

    if (mode === "register") {
      result = await apiRequest("POST", "/api/register", { name, email, password });
    } else {
      result = await apiRequest("POST", "/api/login", { email, password });
    }

    saveSession(result.user);
    window.location.href = "dashboard.html";
  } catch (err) {
    showError(err.message);
  } finally {
    submitBtn.disabled = false;
  }
});

document.querySelectorAll("input").forEach((input) => {
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitBtn.click();
  });
});

function showError(text) {
  msg.textContent = text;
  msg.className = "form-msg error";
}
