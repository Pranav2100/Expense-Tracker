const express = require("express");
const { body, query, validationResult } = require("express-validator");
const { createExpense, listExpenses, VALID_CATEGORIES } = require("./expenses.model");

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: "Validation failed", details: errors.array() });
  }
  next();
};

router.post(
  "/",
  [
    body("amount")
      .toFloat()
      .isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0"),
    body("category")
      .trim()
      .notEmpty().withMessage("Category is required")
      .isIn(VALID_CATEGORIES).withMessage("Invalid category selected"),
    body("description")
      .trim()
      .notEmpty().withMessage("Description is required")
      .isLength({ max: 500 }).withMessage("Description must be under 500 characters"),
    body("date")
      .trim()
      .notEmpty().withMessage("Date is required")
      .matches(/^\d{4}-\d{2}-\d{2}$/).withMessage("Date must be YYYY-MM-DD")
      .custom((val) => {
        const date = new Date(val);
        if (isNaN(date.getTime())) throw new Error("Invalid date");
        const now = new Date();
        now.setDate(now.getDate() + 1);
        if (date > now) throw new Error("Date cannot be in the future");
        return true;
      }),
  ],
  validate,
  async (req, res) => {
    try {
      const idempotency_key = req.headers["x-idempotency-key"] || req.body.idempotency_key || null;
      const { expense, created } = await createExpense({ ...req.body, idempotency_key });
      return res.status(created ? 201 : 200).json({ expense });
    } catch (err) {
      console.error("POST /expenses error:", err);
      return res.status(500).json({ error: "Failed to create expense" });
    }
  }
);

router.get(
  "/",
  [
    query("category").optional().trim().isLength({ max: 100 }),
    query("sort").optional().isIn(["date_desc", "date_asc"]).withMessage("sort must be date_desc or date_asc"),
  ],
  validate,
  async (req, res) => {
    try {
      const { category, sort } = req.query;
      const expenses = await listExpenses({ category, sort });
      const total = expenses.reduce((sum, e) => sum + Math.round(e.amount * 100), 0) / 100;
      return res.json({
        expenses,
        meta: {
          count: expenses.length,
          total,
          filters: { category: category || null, sort: sort || "date_desc" },
        },
      });
    } catch (err) {
      console.error("GET /expenses error:", err);
      return res.status(500).json({ error: "Failed to fetch expenses" });
    }
  }
);

router.get("/categories", (req, res) => {
  res.json({ categories: VALID_CATEGORIES });
});

module.exports = router;
