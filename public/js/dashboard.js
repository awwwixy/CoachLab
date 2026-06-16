const session = getSession();
if (!session) {
  window.location.href = "login.html";
}

let state = { user: null, course: null, lessons: [] };

const RING_RADIUS = 54;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

async function loadDashboard() {
  try {
    const data = await apiRequest("GET", "/api/state/" + session.id);
    state.user = data.user;
    state.course = data.course;
    state.lessons = data.lessons;
    renderAll();
  } catch (err) {
    clearSession();
    window.location.href = "login.html";
  }
}

function renderAll() {
  renderWelcome();
  renderLessons();
  renderProgress();
  renderPayZone();
  renderNotifications();
  renderAnswers();
  renderProfileMenu();
}

function renderWelcome() {
  document.getElementById("userName").textContent = state.user.name;
}

function renderLessons() {
  const grid = document.getElementById("lessonsGrid");
  grid.innerHTML = "";

  state.lessons.forEach((lesson) => {
    const unlocked = lesson.free || state.user.paid;
    const done = state.user.progress[lesson.id] === true;

    const card = document.createElement("div");
    card.className = "lesson";

    card.innerHTML = `
      <div class="thumb">
        <img src="${lesson.image}" alt="${lesson.title}" />
        <span class="tag ${unlocked ? "" : "locked"}">
          ${unlocked ? (lesson.free ? "Безкоштовно" : "Доступно") : "🔒 Заблоковано"}
        </span>
      </div>
      <div class="body">
        <h4>${lesson.title}</h4>
        <p class="desc">${lesson.description}</p>
        <div class="row">
          ${
            unlocked
              ? `<button class="btn btn-primary watch-btn" data-id="${lesson.id}">▶ Дивитися урок</button>`
              : `<button class="btn btn-ghost" disabled>🔒 Спочатку оплати курс</button>`
          }
        </div>
        ${
          unlocked
            ? `<div class="row">
                 <label class="check">
                   <input type="checkbox" class="done-check" data-id="${lesson.id}" ${done ? "checked" : ""} />
                   <span class="box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></span>
                   Виконано
                 </label>
               </div>`
            : ""
        }
      </div>
    `;
    grid.appendChild(card);
  });

  document.querySelectorAll(".watch-btn").forEach((btn) => {
    btn.addEventListener("click", () => openVideo(Number(btn.dataset.id)));
  });

  document.querySelectorAll(".done-check").forEach((box) => {
    box.addEventListener("change", () => toggleDone(Number(box.dataset.id), box.checked));
  });
}

function renderProgress() {
  const total = state.lessons.length;
  const completed = state.lessons.filter((l) => state.user.progress[l.id] === true).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.getElementById("progressCount").textContent = completed + " / " + total;
  document.getElementById("progressPct").textContent = percent + "%";

  const bar = document.getElementById("progressBar");
  bar.style.strokeDasharray = RING_LENGTH;
  bar.style.strokeDashoffset = RING_LENGTH * (1 - percent / 100);
}

function renderPayZone() {
  const zone = document.getElementById("payZone");

  if (state.user.paid) {
    zone.innerHTML = `
      <div class="owned-card">
        <span class="ico">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </span>
        <div>
          <div style="font-weight:700">Курс активний</div>
          <div class="small">Усі уроки розблоковані</div>
        </div>
      </div>`;
  } else {
    zone.innerHTML = `
      <div class="pay-card">
        <h3>${state.course.title}</h3>
        <div class="price">${state.course.price} ${state.course.currency}</div>
        <p>${state.course.description}</p>
        <button class="btn btn-primary btn-block" id="openPayBtn">
          Оплатити курс — ${state.course.price} ${state.course.currency}
        </button>
      </div>`;
    document.getElementById("openPayBtn").addEventListener("click", openPayModal);
  }
}

function renderNotifications() {
  const list = document.getElementById("notifList");
  const badge = document.getElementById("notifBadge");
  const notifs = state.user.notifications || [];

  const unread = notifs.filter((n) => !n.read).length;
  if (unread > 0) {
    badge.textContent = unread;
    badge.hidden = false;
  } else {
    badge.hidden = true;
  }

  if (notifs.length === 0) {
    list.innerHTML = `<div class="notif-empty">Сповіщень поки немає</div>`;
    return;
  }
  list.innerHTML = notifs
    .map(
      (n) => `
      <div class="notif-item">
        <span class="ico">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/></svg>
        </span>
        <div>
          <div>${n.text}</div>
          <div class="date">${n.date}</div>
        </div>
      </div>`
    )
    .join("");
}

function renderAnswers() {
  document.getElementById("answerGoal").value = state.user.answers.goal || "";
  document.getElementById("answerPlan").value = state.user.answers.plan || "";
}

function renderProfileMenu() {
  document.getElementById("menuName").textContent = state.user.name;
  document.getElementById("menuEmail").textContent = state.user.email;
}

function openVideo(lessonId) {
  const lesson = state.lessons.find((l) => l.id === lessonId);
  if (!lesson) return;

  document.getElementById("videoTitle").textContent = lesson.title;
  document.getElementById("videoDesc").textContent = lesson.description;
  const frame = document.getElementById("videoFrame");
  const drive = lesson.video.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (drive) {
    frame.innerHTML = `<iframe src="https://drive.google.com/file/d/${drive[1]}/preview" allow="autoplay" allowfullscreen></iframe>`;
  } else {
    frame.innerHTML = `<video controls src="${lesson.video}"></video>`;
  }
  openModal("videoModal");
}

async function toggleDone(lessonId, done) {
  try {
    const result = await apiRequest("POST", "/api/progress", {
      userId: state.user.id,
      lessonId: lessonId,
      done: done,
    });
    state.user = result.user;
    renderProgress();
    renderNotifications();
    if (done) showToast("Урок виконано ✓");
  } catch (err) {
    showToast(err.message);
  }
}

document.querySelectorAll("[data-task]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const taskId = btn.dataset.task;
    const text = document.getElementById(taskId === "goal" ? "answerGoal" : "answerPlan").value;

    try {
      const result = await apiRequest("POST", "/api/answer", {
        userId: state.user.id,
        taskId: taskId,
        text: text,
      });
      state.user = result.user;

      const note = document.querySelector(`[data-note="${taskId}"]`);
      note.classList.add("show");
      setTimeout(() => note.classList.remove("show"), 1800);
    } catch (err) {
      showToast(err.message);
    }
  });
});

function openPayModal() {
  document.getElementById("payCourseName").textContent = state.course.title;
  document.getElementById("payTotal").textContent = state.course.price + " " + state.course.currency;
  document.getElementById("payMsg").textContent = "";
  openModal("payModal");
}

document.getElementById("payConfirmBtn").addEventListener("click", async () => {
  const number = document.getElementById("cardNumber").value.replace(/\s/g, "");
  const exp = document.getElementById("cardExp").value.trim();
  const cvv = document.getElementById("cardCvv").value.trim();
  const msg = document.getElementById("payMsg");
  const btn = document.getElementById("payConfirmBtn");

  if (number.length < 12 || !/^\d+$/.test(number)) {
    msg.className = "form-msg error";
    msg.textContent = "Введи коректний номер картки (мінімум 12 цифр).";
    return;
  }
  if (!/^\d{2}\/\d{2}$/.test(exp)) {
    msg.className = "form-msg error";
    msg.textContent = "Термін дії має бути у форматі ММ/РР.";
    return;
  }
  if (cvv.length !== 3) {
    msg.className = "form-msg error";
    msg.textContent = "CVV — це 3 цифри.";
    return;
  }

  try {
    btn.disabled = true;
    btn.textContent = "Обробка...";

    await new Promise((r) => setTimeout(r, 900));

    const result = await apiRequest("POST", "/api/pay", { userId: state.user.id });
    state.user = result.user;

    document.getElementById("payModalBody").innerHTML = `
      <div class="pay-success">
        <div class="check-circle">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h3>Оплата успішна!</h3>
        <p>Доступ до всіх уроків відкрито. Гарного навчання!</p>
        <button class="btn btn-primary btn-block" id="payDoneBtn" style="margin-top:18px;">Перейти до уроків</button>
      </div>`;

    document.getElementById("payDoneBtn").addEventListener("click", () => {
      closeModal("payModal");
      renderAll();
    });
  } catch (err) {
    msg.className = "form-msg error";
    msg.textContent = err.message;
    btn.disabled = false;
    btn.textContent = "Оплатити";
  }
});

document.getElementById("cardNumber").addEventListener("input", (e) => {
  let digits = e.target.value.replace(/\D/g, "").slice(0, 16);
  e.target.value = digits.replace(/(.{4})/g, "$1 ").trim();
});
document.getElementById("cardExp").addEventListener("input", (e) => {
  let digits = e.target.value.replace(/\D/g, "").slice(0, 4);
  e.target.value = digits.length > 2 ? digits.slice(0, 2) + "/" + digits.slice(2) : digits;
});

const notifDropdown = document.getElementById("notifDropdown");
const profileDropdown = document.getElementById("profileDropdown");

document.getElementById("bellBtn").addEventListener("click", async (e) => {
  e.stopPropagation();
  profileDropdown.hidden = true;
  notifDropdown.hidden = !notifDropdown.hidden;

  if (!notifDropdown.hidden) {
    try {
      const result = await apiRequest("POST", "/api/notifications/read", { userId: state.user.id });
      state.user = result.user;
      document.getElementById("notifBadge").hidden = true;
    } catch (err) {}
  }
});

document.getElementById("profileBtn").addEventListener("click", (e) => {
  e.stopPropagation();
  notifDropdown.hidden = true;
  profileDropdown.hidden = !profileDropdown.hidden;
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  clearSession();
  window.location.href = "index.html";
});

document.addEventListener("click", () => {
  notifDropdown.hidden = true;
  profileDropdown.hidden = true;
});
notifDropdown.addEventListener("click", (e) => e.stopPropagation());
profileDropdown.addEventListener("click", (e) => e.stopPropagation());

function openModal(id) {
  document.getElementById(id).hidden = false;
}
function closeModal(id) {
  document.getElementById(id).hidden = true;
  if (id === "videoModal") {
    document.getElementById("videoFrame").innerHTML = "";
  }
}

document.querySelectorAll("[data-close]").forEach((btn) => {
  btn.addEventListener("click", () => closeModal(btn.dataset.close));
});
document.querySelectorAll(".modal-overlay").forEach((overlay) => {
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal(overlay.id);
  });
});

let toastTimer = null;
function showToast(text) {
  const toast = document.getElementById("toast");
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
}

if (session) loadDashboard();
