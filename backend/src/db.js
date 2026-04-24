const initSqlJs = require("sql.js");
const path = require("path");
const fs = require("fs");

const DB_PATH = process.env.DB_PATH === ":memory:"
  ? null
  : (process.env.DB_PATH || path.join(__dirname, "../data/expenses.db"));

let db;

// sql.js is async to init (loads WASM), so we export a promise
// All other modules must await getDb() before using it
let dbReady;

async function initDb() {
  const SQL = await initSqlJs();

  if (DB_PATH) {
    // Ensure data directory exists
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    // Load existing DB file if it exists
    if (fs.existsSync(DB_PATH)) {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
    }
  } else {
    // In-memory for tests
    db = new SQL.Database();
  }

  // Run schema
  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id          TEXT PRIMARY KEY,
      amount      INTEGER NOT NULL CHECK (amount > 0),
      category    TEXT NOT NULL,
      description TEXT NOT NULL,
      date        TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE TABLE IF NOT EXISTS idempotency_keys (
      key         TEXT PRIMARY KEY,
      expense_id  TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
  `);

  return db;
}

// Persist DB to disk after every write (sql.js keeps DB in memory, we flush to file)
function persist() {
  if (!DB_PATH) return; // skip for in-memory / test mode
  try {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (err) {
    console.error("Failed to persist DB:", err);
  }
}

// Helper: run a query and return all rows as objects
function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: run a query and return first row as object
function get(sql, params = []) {
  const rows = all(sql, params);
  return rows[0] || null;
}

// Helper: run a write query
function run(sql, params = []) {
  db.run(sql, params);
  persist();
}

// Initialize on startup
dbReady = initDb();

module.exports = { dbReady, all, get, run, persist };
