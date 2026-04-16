// === API ===
const API = "https://star-kombat-online.onrender.com";

// === TELEGRAM ===
const tg = window.Telegram.WebApp;
const TELEGRAM_ID = tg.initDataUnsafe.user.id;

// === ДАНІ ГРАВЦЯ ===
let balance = 0;
let perClick = 1;
let perSecond = 0;
let totalEarned = 0;

// === DOM ===
const usernameEl = document.getElementById("username");
const levelEl = document.getElementById("level");
const balanceEl = document.getElementById("balance");
const perClickEl = document.getElementById("perClick");
const perSecondEl = document.getElementById("perSecond");
const totalEarnedEl = document.getElementById("totalEarned");

const tapButton = document.getElementById("tapButton");
const priceClick = document.getElementById("priceClick");
const pricePassive = document.getElementById("pricePassive");

// === ЦІНИ АПГРЕЙДІВ ===
let upgradeClickPrice = 20;
let upgradePassivePrice = 50;

// === ЗАГРУЗКА ПРОГРЕСА ===
async function loadProgress() {
    try {
        const res = await fetch(`${API}/load?telegram_id=${TELEGRAM_ID}`);
        const data = await res.json();

        if (data.status !== "new") {
            balance = data.coins;
            totalEarned = data.exp;
            perClick = data.level;
        }

        updateUI();
    } catch (e) {
        console.error("Ошибка загрузки:", e);
    }
}

// === СОХРАНЕНИЕ ПРОГРЕСА ===
async function saveProgress() {
    try {
        await fetch(`${API}/save`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                telegram_id: TELEGRAM_ID,
                level: perClick,
                exp: totalEarned,
                coins: balance,
                inventory: []
            })
        });
    } catch (e) {
        console.error("Ошибка сохранения:", e);
    }
}

// === ОБНОВЛЕНИЕ UI ===
function updateUI() {
    usernameEl.textContent = "@" + tg.initDataUnsafe.user.username;
    balanceEl.textContent = balance;
    perClickEl.textContent = perClick;
    perSecondEl.textContent = perSecond;
    totalEarnedEl.textContent = totalEarned;

    levelEl.textContent = "LVL " + (1 + Math.floor(totalEarned / 100));
}

// === ТАП ===
tapButton.onclick = () => {
    balance += perClick;
    totalEarned += perClick;

    saveProgress();
    updateUI();
};

// === АПГРЕЙД КЛИКА ===
document.getElementById("upgradeClick").onclick = () => {
    if (balance < upgradeClickPrice) return;

    balance -= upgradeClickPrice;
    perClick++;
    upgradeClickPrice = Math.floor(upgradeClickPrice * 1.7);

    priceClick.textContent = upgradeClickPrice + " ★";

    saveProgress();
    updateUI();
};

// === АПГРЕЙД ПАССИВА ===
document.getElementById("upgradePassive").onclick = () => {
    if (balance < upgradePassivePrice) return;

    balance -= upgradePassivePrice;
    perSecond++;
    upgradePassivePrice = Math.floor(upgradePassivePrice * 1.9);

    pricePassive.textContent = upgradePassivePrice + " ★";

    saveProgress();
    updateUI();
};

// === ПАССИВНИЙ ДОХОД ===
setInterval(() => {
    if (perSecond > 0) {
        balance += perSecond;
        totalEarned += perSecond;
        saveProgress();
        updateUI();
    }
}, 1000);

// === СТАРТ ===
loadProgress();
