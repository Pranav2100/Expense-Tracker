import { useState } from "react";
import { useExpenses, useCategories } from "../hooks";
import { formatCurrency, formatDate, CATEGORY_COLORS } from "../utils";

export default function ExpenseList({ refreshTrigger }) {
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("date_desc");
  const categories = useCategories();
  const { expenses, meta, loading, error, refresh } = useExpenses({ category, sort, _trigger: refreshTrigger });

  return (
    <div className="card list-card">
      <div className="list-header">
        <h2 className="section-title">Expenses</h2>
        <div className="filters">
          <div className="field field--inline">
            <label htmlFor="filter-category">Category</label>
            <select id="filter-category" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="field field--inline">
            <label htmlFor="filter-sort">Sort</label>
            <select id="filter-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="date_desc">Newest first</option>
              <option value="date_asc">Oldest first</option>
            </select>
          </div>
        </div>
      </div>

      {meta && (
        <div className="summary-bar">
          <span className="summary-count">{meta.count} {meta.count === 1 ? "entry" : "entries"}</span>
          <span className="summary-total">Total: <strong>{formatCurrency(meta.total)}</strong></span>
        </div>
      )}

      {loading && <div className="state-msg">Loading expenses…</div>}
      {error && (
        <div className="alert alert--error">
          {error} <button className="link-btn" onClick={refresh}>Retry</button>
        </div>
      )}

      {!loading && !error && expenses.length === 0 && (
        <div className="state-msg empty">
          {category !== "all" ? `No expenses in "${category}" yet.` : "No expenses yet. Add your first one above!"}
        </div>
      )}

      {!loading && expenses.length > 0 && (
        <>
          <div className="table-wrapper">
            <table className="expense-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td className="date-cell">{formatDate(exp.date)}</td>
                    <td>
                      <span className="category-badge" style={{ "--badge-color": CATEGORY_COLORS[exp.category] || "#95a5a6" }}>
                        {exp.category}
                      </span>
                    </td>
                    <td className="desc-cell">{exp.description}</td>
                    <td className="amount-cell text-right">{formatCurrency(exp.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="totals-row">
                  <td colSpan="3"><strong>Total ({meta.count} {meta.count === 1 ? "item" : "items"})</strong></td>
                  <td className="text-right amount-cell"><strong>{formatCurrency(meta.total)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <CategoryBreakdown expenses={expenses} />
        </>
      )}
    </div>
  );
}

function CategoryBreakdown({ expenses }) {
  const breakdown = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  if (entries.length <= 1) return null;

  const total = entries.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="breakdown">
      <h3 className="breakdown-title">By Category</h3>
      <div className="breakdown-rows">
        {entries.map(([cat, amount]) => {
          const pct = total > 0 ? (amount / total) * 100 : 0;
          return (
            <div className="breakdown-row" key={cat}>
              <span className="breakdown-label" style={{ "--badge-color": CATEGORY_COLORS[cat] || "#95a5a6" }}>
                <span className="dot" /> {cat}
              </span>
              <div className="breakdown-bar-wrap">
                <div className="breakdown-bar" style={{ width: `${pct}%`, background: CATEGORY_COLORS[cat] || "#95a5a6" }} />
              </div>
              <span className="breakdown-amount">{formatCurrency(amount)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
