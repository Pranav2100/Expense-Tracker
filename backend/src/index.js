const express = require("express");
const cors = require("cors");
const { dbReady } = require("./db");
const expensesRouter = require("./expenses.router");

const app = express();

// CORS must come before express.json()
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-Idempotency-Key"],
}));

// Handle preflight
app.options("*", cors());

app.use(express.json());

// Debug log
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} BODY:`, JSON.stringify(req.body));
  next();
});

app.use("/expenses", expensesRouter);

app.get("/health", (req, res) => res.json({ status: "ok", ts: new Date().toISOString() }));

app.use((req, res) => res.status(404).json({ error: "Not found" }));

app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  dbReady.then(() => {
    app.listen(PORT, () => {
      console.log(`Expense Tracker API running on port ${PORT}`);
    });
  }).catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
}

module.exports = app;
