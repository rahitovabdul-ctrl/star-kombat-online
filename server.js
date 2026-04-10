import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = 3000;

// ==========================
//   "БАЗА ДАННЫХ" В ПАМЯТИ
// ==========================
let users = []; 
let sessions = {}; 

// ==========================
//   УТИЛИТЫ
// ==========================
function createUser(username, password, ref) {
  const id = uuidv4();
  const user = {
    id,
    username,
    password,
    stars: 0,
    totalEarned: 0,
    autoClicker: false,
    referrals: 0,
    createdAt: Date.now()
  };

  users.push(user);

  // Реферальный бонус
  if (ref) {
    const refUser = users.find(u => u.id === ref);
    if (refUser) {
      refUser.stars += 50;
      refUser.totalEarned += 50;
      refUser.referrals++;
    }
  }

  return user;
}

function createSession(userId) {
  const token = uuidv4();
  sessions[token] = userId;
  return token;
}

function auth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token || !sessions[token]) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const user = users.find(u => u.id === sessions[token]);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  req.user = user;
  next();
}

// ==========================
//   РЕГИСТРАЦИЯ
// ==========================
app.post("/api/register", (req, res) => {
  const { username, password, ref } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: "username and password required" });

  if (users.find(u => u.username === username))
    return res.status(400).json({ error: "username already taken" });

  const user = createUser(username, password, ref);
  const token = createSession(user.id);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      stars: user.stars,
      totalEarned: user.totalEarned,
      autoClicker: user.autoClicker
    }
  });
});

// ==========================
//   ЛОГИН
// ==========================
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) return res.status(400).json({ error: "invalid credentials" });

  const token = createSession(user.id);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      stars: user.stars,
      totalEarned: user.totalEarned,
      autoClicker: user.autoClicker
    }
  });
});

// ==========================
//   ПРОФИЛЬ
// ==========================
app.get("/api/me", auth, (req, res) => {
  const u = req.user;
  res.json({
    id: u.id,
    username: u.username,
    stars: u.stars,
    totalEarned: u.totalEarned,
    autoClicker: u.autoClicker,
    refLink: `http://localhost:${PORT}/?ref=${u.id}`
  });
});

// ==========================
//   ОБНОВЛЕНИЕ ОЧКОВ
// ==========================
app.post("/api/progress", auth, (req, res) => {
  const { starsDelta, totalEarnedDelta } = req.body;
  const u = req.user;

  if (typeof starsDelta === "number") u.stars += starsDelta;
  if (typeof totalEarnedDelta === "number") u.totalEarned += totalEarnedDelta;

  if (u.stars < 0) u.stars = 0;
  if (u.totalEarned < 0) u.totalEarned = 0;

  res.json({
    stars: u.stars,
    totalEarned: u.totalEarned
  });
});

// ==========================
//   ПОКУПКА АВТОКЛИКЕРА
// ==========================
app.post("/api/buy-autoclicker", auth, (req, res) => {
  const u = req.user;
  const price = 1000;

  if (u.autoClicker)
    return res.status(400).json({ error: "already owned" });

  if (u.stars < price)
    return res.status(400).json({ error: "not enough stars" });

  u.stars -= price;
  u.autoClicker = true;

  res.json({
    stars: u.stars,
    autoClicker: u.autoClicker
  });
});

// ==========================
//   ТОП 50
// ==========================
app.get("/api/leaderboard", (req, res) => {
  const top = [...users]
    .sort((a, b) => b.totalEarned - a.totalEarned)
    .slice(0, 50)
    .map(u => ({
      id: u.id,
      username: u.username,
      totalEarned: u.totalEarned
    }));

  res.json(top);
});

// ==========================
//   ИНФО О ЮЗЕРЕ
// ==========================
app.get("/api/user/:id", (req, res) => {
  const u = users.find(x => x.id === req.params.id);
  if (!u) return res.status(404).json({ error: "not found" });

  res.json({
    id: u.id,
    username: u.username,
    totalEarned: u.totalEarned
  });
});

// ==========================
//   СТАРТ СЕРВЕРА
// ==========================
app.listen(PORT, () => {
  console.log("Server running on http://localhost:" + PORT);
});
