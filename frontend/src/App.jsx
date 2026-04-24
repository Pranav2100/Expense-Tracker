import { useState, useCallback } from "react";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";

export default function App() {
  const [listKey, setListKey] = useState(0);

  const handleExpenseAdded = useCallback(() => {
    setListKey((k) => k + 1);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon" aria-hidden="true">₹</span>
            <div>
              <h1>Expense Tracker</h1>
              <p className="tagline">Track what you spend, understand where it goes</p>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <ExpenseForm onExpenseAdded={handleExpenseAdded} />
        <ExpenseList refreshTrigger={listKey} />
      </main>

      <footer className="app-footer">
        <p>Expense Tracker · Built for Fenmo Assessment</p>
      </footer>
    </div>
  );
}
