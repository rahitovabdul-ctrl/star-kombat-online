import { openDb } from "./db.js";

const init = async () => {
  const db = await openDb();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      telegram_id INTEGER PRIMARY KEY,
      level INTEGER DEFAULT 1,
      exp INTEGER DEFAULT 0,
      coins INTEGER DEFAULT 0,
      inventory TEXT
    );
  `);

  console.log("DB ready");
};

init();
