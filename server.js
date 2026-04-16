const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// ВАЖЛИВО: отдаём index.html, game.js, style.css
app.use(express.static(__dirname));

const DB_FILE = "db.json";

if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, "{}");
}

function loadDB() {
    return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(db) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

app.get("/load", (req, res) => {
    const id = req.query.telegram_id;
    const db = loadDB();

    if (!db[id]) {
        return res.json({ status: "new" });
    }

    res.json(db[id]);
});

app.post("/save", (req, res) => {
    const { telegram_id, level, exp, coins, inventory } = req.body;

    const db = loadDB();

    db[telegram_id] = {
        level,
        exp,
        coins,
        inventory
    };

    saveDB(db);

    res.json({ status: "ok" });
});

app.listen(3000, () => console.log("API running on port 3000"));
