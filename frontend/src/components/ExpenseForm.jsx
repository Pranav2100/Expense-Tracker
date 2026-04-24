import { useState, useRef } from "react";
import { useCategories } from "../hooks";
import { createExpense, ApiError } from "../api";
import { todayISO } from "../utils";

export default function ExpenseForm({ onExpenseAdded }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");
  const categories = useCategories();

  // Use a ref for the form element so we read values directly at submit time
  const formRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Read values directly from the DOM — no stale state issues
    const formEl = formRef.current;
    const amount = parseFloat(formEl.amount.value);
    const category = formEl.category.value;
    const description = formEl.description.value.trim();
    const date = formEl.date.value;

    // Client-side validation
    const errors = {};
    if (!formEl.amount.value || isNaN(amount) || amount <= 0) errors.amount = "Amount must be greater than 0";
    if (!category) errors.category = "Please select a category";
    if (!description) errors.description = "Description is required";
    if (!date) errors.date = "Date is required";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setFieldErrors({});

    const payload = { amount, category, description, date };

    try {
      const result = await createExpense(payload);
      formEl.reset();
      // Reset date to today after clear
      formEl.date.value = todayISO();
      setSuccessMsg("Expense added ✓");
      setTimeout(() => setSuccessMsg(""), 3000);
      onExpenseAdded?.(result.expense);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422 && err.details) {
        const fieldMap = {};
        err.details.forEach((d) => {
          const key = d.path || d.param;
          if (key && !fieldMap[key]) fieldMap[key] = d.msg;
        });
        setFieldErrors(fieldMap);
      } else {
        setSubmitError(err.message || "Submission failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card form-card">
      <h2 className="section-title">Add Expense</h2>
      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <div className="field">
            <label htmlFor="amount">Amount (₹)</label>
            <input
              id="amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              onChange={() => setFieldErrors((p) => ({ ...p, amount: undefined }))}
            />
            {fieldErrors.amount && <span className="field-error">{fieldErrors.amount}</span>}
          </div>

          <div className="field">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              defaultValue=""
              onChange={() => setFieldErrors((p) => ({ ...p, category: undefined }))}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {fieldErrors.category && <span className="field-error">{fieldErrors.category}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="field field--wide">
            <label htmlFor="description">Description</label>
            <input
              id="description"
              name="description"
              type="text"
              placeholder="What did you spend on?"
              maxLength={500}
              onChange={() => setFieldErrors((p) => ({ ...p, description: undefined }))}
            />
            {fieldErrors.description && <span className="field-error">{fieldErrors.description}</span>}
          </div>

          <div className="field">
            <label htmlFor="date">Date</label>
            <input
              id="date"
              name="date"
              type="date"
              defaultValue={todayISO()}
              max={todayISO()}
              onChange={() => setFieldErrors((p) => ({ ...p, date: undefined }))}
            />
            {fieldErrors.date && <span className="field-error">{fieldErrors.date}</span>}
          </div>
        </div>

        {submitError && (
          <div className="alert alert--error" role="alert">{submitError}</div>
        )}
        {successMsg && (
          <div className="alert alert--success" role="status">{successMsg}</div>
        )}

        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? <><span className="spinner" aria-hidden="true" /> Saving…</> : "Add Expense"}
        </button>
      </form>
    </div>
  );
}
