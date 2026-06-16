const express = require("express");
const fs = require("fs");
const path = require("path");

const { incrementalCounter } = require("./lib/generators");
const { memoize } = require("./lib/memoize");
const { BiPriorityQueue } = require("./lib/priorityQueue");
const { asyncMap } = require("./lib/asyncArray");
const { EventBus } = require("./lib/events");
const { log, setLevel } = require("./lib/logger");

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, "db.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const bus = new EventBus();
setLevel("INFO");
bus.on("course:paid", (p) => console.log(`[подія] користувач #${p.userId} оплатив курс`));
bus.on("lesson:done", (p) => console.log(`[подія] користувач #${p.userId} виконав урок ${p.lessonId}`));

const notifIdGen = incrementalCounter(Date.now());

const readDB = log(function readDB() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}, { level: "DEBUG", name: "readDB" });

const writeDB = log(function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}, { level: "DEBUG", name: "writeDB" });

const courseStats = memoize(
  (lessons) => ({ total: lessons.length, free: lessons.filter((l) => l.free).length }),
  { policy: "TTL", ttl: 5000, maxSize: 10 }
);

const TYPE_PRIORITY = { access: 3, progress: 2, welcome: 1, info: 0 };
function orderNotifications(notifs) {
  const pq = new BiPriorityQueue();
  notifs.forEach((n, i) => {
    const score = (TYPE_PRIORITY[n.type] || 0) * 1000 + (notifs.length - i);
    pq.enqueue(n, score);
  });
  return pq.toArray("highest");
}

function safeUser(user) {
  const copy = { ...user };
  delete copy.password;
  return copy;
}

function findUser(db, id) {
  return db.users.find((u) => u.id === Number(id));
}

function addNotification(user, text, type) {
  user.notifications.unshift({
    id: notifIdGen.next().value,
    text: text,
    type: type || "info",
    read: false,
    date: new Date().toISOString().slice(0, 10),
  });
}

app.post("/api/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Заповніть усі поля." });
  }

  const db = readDB();

  const exists = db.users.some((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "Користувач з таким email вже існує." });
  }

  const newUser = {
    id: db.nextUserId,
    name: name,
    email: email,
    password: password,
    paid: false,
    progress: {},
    answers: { goal: "", plan: "" },
    notifications: [
      {
        id: notifIdGen.next().value,
        text: "Ласкаво просимо до CoachLab! Перший урок доступний безкоштовно.",
        type: "welcome",
        read: false,
        date: new Date().toISOString().slice(0, 10),
      },
    ],
  };

  db.users.push(newUser);
  db.nextUserId += 1;
  writeDB(db);

  res.json({ user: safeUser(newUser) });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const db = readDB();

  const user = db.users.find(
    (u) => u.email.toLowerCase() === (email || "").toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: "Невірний email або пароль." });
  }

  res.json({ user: safeUser(user) });
});

app.get("/api/state/:id", async (req, res) => {
  const db = readDB();
  const user = findUser(db, req.params.id);
  if (!user) return res.status(404).json({ error: "Користувача не знайдено." });

  const lessons = await asyncMap(db.lessons, async (l) => ({
    ...l,
    unlocked: l.free || user.paid,
  }));

  const safe = safeUser(user);
  safe.notifications = orderNotifications(safe.notifications);

  res.json({
    user: safe,
    course: db.course,
    lessons: lessons,
    stats: courseStats(db.lessons),
  });
});

app.post("/api/pay", (req, res) => {
  const { userId } = req.body;
  const db = readDB();
  const user = findUser(db, userId);
  if (!user) return res.status(404).json({ error: "Користувача не знайдено." });

  user.paid = true;
  addNotification(user, "Доступ до курсу відкрито. Усі уроки розблоковані!", "access");
  writeDB(db);

  bus.emit("course:paid", { userId: user.id });
  res.json({ user: safeUser(user) });
});

app.post("/api/progress", (req, res) => {
  const { userId, lessonId, done } = req.body;
  const db = readDB();
  const user = findUser(db, userId);
  if (!user) return res.status(404).json({ error: "Користувача не знайдено." });

  user.progress[lessonId] = !!done;

  if (done) {
    const lesson = db.lessons.find((l) => l.id === Number(lessonId));
    const title = lesson ? lesson.title : "Урок";
    addNotification(user, '"' + title + '" — урок виконано. Так тримати!', "progress");
    bus.emit("lesson:done", { userId: user.id, lessonId });
  }

  writeDB(db);
  res.json({ user: safeUser(user) });
});

app.post("/api/answer", (req, res) => {
  const { userId, taskId, text } = req.body;
  const db = readDB();
  const user = findUser(db, userId);
  if (!user) return res.status(404).json({ error: "Користувача не знайдено." });

  user.answers[taskId] = text;
  writeDB(db);
  res.json({ user: safeUser(user) });
});

app.post("/api/notifications/read", (req, res) => {
  const { userId } = req.body;
  const db = readDB();
  const user = findUser(db, userId);
  if (!user) return res.status(404).json({ error: "Користувача не знайдено." });

  user.notifications.forEach((n) => (n.read = true));
  writeDB(db);
  res.json({ user: safeUser(user) });
});

app.listen(PORT, () => {
  console.log("CoachLab запущено! Відкрий у браузері: http://localhost:" + PORT);
});
