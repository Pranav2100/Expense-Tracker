const { dbReady, all, get, run } = require("./db");
const { v4: uuidv4 } = require("uuid");

const toPaise = (rupees) => Math.round(parseFloat(rupees) * 100);
const toRupees = (paise) => paise / 100;

const VALID_CATEGORIES = [
  "Food", "Transport", "Housing", "Entertainment",
  "Healthcare", "Shopping", "Utilities", "Education", "Other",
];

const createExpense = async (data) => {
  await dbReady;
  const { amount, category, description, date, idempotency_key } = data;

  // Check idempotency
  if (idempotency_key) {
    const existing = get(
      `SELECT e.* FROM expenses e
       JOIN idempotency_keys ik ON e.id = ik.expense_id
       WHERE ik.key = ?`,
      [idempotency_key]
    );
    if (existing) {
      return { expense: formatExpense(existing), created: false };
    }
  }

  const id = uuidv4();
  const amountPaise = toPaise(amount);
  const now = new Date().toISOString();

  run(
    `INSERT INTO expenses (id, amount, category, description, date, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, amountPaise, category, description.trim(), date, now]
  );

  if (idempotency_key) {
    run(
      `INSERT INTO idempotency_keys (key, expense_id, created_at) VALUES (?, ?, ?)`,
      [idempotency_key, id, now]
    );
  }

  const expense = get("SELECT * FROM expenses WHERE id = ?", [id]);
  return { expense: formatExpense(expense), created: true };
};

const listExpenses = async ({ category, sort } = {}) => {
  await dbReady;

  let query = "SELECT * FROM expenses WHERE 1=1";
  const params = [];

  if (category && category !== "all") {
    query += " AND category = ?";
    params.push(category);
  }

  query += sort === "date_asc"
    ? " ORDER BY date ASC, created_at ASC"
    : " ORDER BY date DESC, created_at DESC";

  const rows = all(query, params);
  return rows.map(formatExpense);
};

const formatExpense = (row) => ({
  id: row.id,
  amount: toRupees(row.amount),
  category: row.category,
  description: row.description,
  date: row.date,
  created_at: row.created_at,
});

module.exports = { createExpense, listExpenses, VALID_CATEGORIES };
