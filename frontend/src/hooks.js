import { useState, useEffect, useCallback } from "react";
import { getExpenses, createExpense, getCategories, ApiError } from "./api";

export function useExpenses(filters) {
  const [expenses, setExpenses] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getExpenses(filters);
      setExpenses(data.expenses);
      setMeta(data.meta);
    } catch (err) {
      setError(err.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [filters.category, filters.sort, filters._trigger]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { expenses, meta, loading, error, refresh: fetchData };
}

export function useExpenseForm(onSuccess) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const submit = useCallback(async (formData) => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    setFieldErrors({});

    try {
      const result = await createExpense(formData);
      onSuccess?.(result.expense);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422 && err.details) {
        // Map array of {path, msg} to object keyed by field name
        const fieldMap = {};
        err.details.forEach((d) => {
          const key = d.path || d.param || d.field;
          if (key) fieldMap[key] = d.msg;
        });
        setFieldErrors(fieldMap);
        // If no field errors were mapped, show generic error
        if (Object.keys(fieldMap).length === 0) {
          setSubmitError(err.message || "Validation failed");
        }
      } else {
        setSubmitError(err.message || "Submission failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }, [submitting, onSuccess]);

  return { submit, submitting, submitError, fieldErrors };
}

export function useCategories() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data.categories))
      .catch(() => setCategories([
        "Food", "Transport", "Housing", "Entertainment",
        "Healthcare", "Shopping", "Utilities", "Education", "Other",
      ]));
  }, []);

  return categories;
}
