const API = "http://localhost:3000/api";

let token = null;
let user = null;

let balance = 0;
let perClick = 1;
let perSecond = 0;
let totalEarned = 0;
let clicks = 0;

let upgradeClickPrice = 20;
let upgradePassivePrice = 50;

let autoClicker = false;

// Ограничение: 60 сек фарма → 20 сек кулдаун
let sessionTime = 0;
let cooldown = 0;

const SESSION_LIMIT = 60;
const COOLDOWN_TIME = 20;

// DOM
const authBox = document.getElementById("authBox");
const gameBox = document.getElementById("gameBox");

const loginUser = document.getElementById("loginUser");
const loginPass = document.getElementById("loginPass");
const btnLogin = document.getElementById("btnLogin");
const btnRegister = document.getElementById("btnRegister");
const authMsg = document.getElementById("authMsg");

const usernameEl = document.getElementById("username");
const levelEl = document.getElementById("level");
const balanceEl = document.getElementById("balance");
const perClickEl = document.getElementById("perClick");
const perSecondEl = document.getElementById("perSecond");
const totalEarnedEl = document.getElementById("totalEarned");
const cooldownEl = document.getElementById("cooldown");

const tapButton = document.getElementById("tapButton");

const priceClick = document.getElementById("priceClick");
const pricePassive = document.getElementById("pricePassive");

const autoStatus = document.getElementById("autoStatus");
const refLink = document.getElementById("refLink");
const leaderboard = document.getElementById("leaderboard");

// API helper
async function api(path, method = "GET", body = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = "Bearer " + token;

  const res = await fetch(API + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "API error");
  return data;
}

// Авторизация
btnLogin.onclick = async () => {
  try {
    const data = await api("/login", "POST", {
      username: loginUser.value,
      password: loginPass.value
    });

    token = data.token;
    user = data.user;

    authBox.style.display = "none";
    gameBox.style.display = "block";

    await loadMe();
    await loadLeaderboard();
    updateUI();
  } catch (e) {
    authMsg.textContent = e.message;
  }
};

btnRegister.onclick = async () => {
  const url = new URL(window.location.href);
  const ref = url.searchParams.get("ref");

  try {
    const data = await api("/register", "POST", {
      username: loginUser.value,
      password: loginPass.value,
      ref
    });

    token = data.token;
    user = data.user;

    authBox.style.display = "none";
    gameBox.style.display = "block";

    await loadMe();
    await loadLeaderboard();
    updateUI();
  } catch (e) {
    authMsg.textContent = e.message;
  }
};

// Загрузка профиля
async function loadMe() {
  const data = await api("/me");
  user = data;

  balance = data.stars;
  totalEarned = data.totalEarned;
  autoClicker = data.autoClicker;

  refLink.textContent = data.refLink;
}

// Обновление UI
function updateUI() {
  usernameEl.textContent = user.username;
  balanceEl.textContent = balance;
  perClickEl.textContent = perClick;
  perSecondEl.textContent = perSecond;
  totalEarnedEl.textContent = totalEarned;

  levelEl.textContent = "LVL " + (1 + Math.floor(totalEarned / 100));

  autoStatus.textContent = autoClicker ? "Куплено" : "Не куплено";

  if (cooldown > 0) {
    cooldownEl.textContent = "Кулдаун: " + cooldown + " сек";
  } else {
    cooldownEl.textContent = "";
  }
}

// Тап
tapButton.onclick = () => {
  if (cooldown > 0) return;
  if (sessionTime >= SESSION_LIMIT) return;

  balance += perClick;
  totalEarned += perClick;
  clicks++;
  sessionTime++;

  syncProgress(perClick, perClick);
  updateUI();
};

// Синхронизация с сервером
async function syncProgress(starsDelta, totalDelta) {
  try {
    const data = await api("/progress", "POST", {
      starsDelta,
      totalEarnedDelta: totalDelta
    });

    balance = data.stars;
    totalEarned = data.totalEarned;
  } catch (e) {
    console.error(e);
  }
}

// Апгрейды
document.getElementById("upgradeClick").onclick = () => {
  if (balance < upgradeClickPrice) return;

  balance -= upgradeClickPrice;
  perClick++;
  upgradeClickPrice = Math.floor(upgradeClickPrice * 1.7);

  priceClick.textContent = upgradeClickPrice + " ★";
  syncProgress(-upgradeClickPrice, 0);
  updateUI();
};

document.getElementById("upgradePassive").onclick = () => {
  if (balance < upgradePassivePrice) return;

  balance -= upgradePassivePrice;
  perSecond++;
  upgradePassivePrice = Math.floor(upgradePassivePrice * 1.9);

  pricePassive.textContent = upgradePassivePrice + " ★";
  syncProgress(-upgradePassivePrice, 0);
  updateUI();
};

// Автокликер
document.getElementById("autoClicker").onclick = async () => {
  if (autoClicker) return;

  try {
    const data = await api("/buy-autoclicker", "POST");
    balance = data.stars;
    autoClicker = true;
    updateUI();
  } catch (e) {
    console.error(e);
  }
};

// Топ 50
async function loadLeaderboard() {
  const data = await api("/leaderboard");
  leaderboard.innerHTML = "";

  data.forEach((p, i) => {
    const row = document.createElement("div");
    row.textContent = `${i + 1}. ${p.username} — ${p.totalEarned} ★`;
    leaderboard.appendChild(row);
  });
}

// Главный таймер
setInterval(() => {
  if (!user) return;

  if (cooldown > 0) {
    cooldown--;
    if (cooldown <= 0) {
      sessionTime = 0;
    }
  }

  if (sessionTime >= SESSION_LIMIT && cooldown === 0) {
    cooldown = COOLDOWN_TIME;
  }

  if (perSecond > 0 && cooldown === 0 && sessionTime < SESSION_LIMIT) {
    balance += perSecond;
    totalEarned += perSecond;
    syncProgress(perSecond, perSecond);
  }

  if (autoClicker && cooldown === 0 && sessionTime < SESSION_LIMIT) {
    balance += perClick;
    totalEarned += perClick;
    sessionTime++;
    syncProgress(perClick, perClick);
  }

  updateUI();
}, 1000);
