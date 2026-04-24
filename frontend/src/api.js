const BASE_URL = import.meta.env.VITE_API_URL || "";
const TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;

class ApiError extends Error {
  constructor(message, status, details = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function request(url, options = {}, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(BASE_URL + url, {
        headers: { "Content-Type": "application/json", ...options.headers },
        ...options,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const shouldRetry = attempt < retries && [429, 502, 503, 504].includes(res.status);
        if (shouldRetry) { await sleep(300 * 2 ** attempt); continue; }
        throw new ApiError(body.error || `Request failed: ${res.status}`, res.status, body.details || null);
      }

      return res.json();
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (attempt < retries) { await sleep(300 * 2 ** attempt); continue; }
      if (err.name === "AbortError") throw new ApiError("Request timed out.", 0);
      throw new ApiError("Network error. Check your connection.", 0);
    }
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function createExpense(data) {
  const idempotency_key = crypto.randomUUID();
  const bodyStr = JSON.stringify(data);
  console.log("SENDING BODY:", bodyStr);
  return request("/expenses", {
    method: "POST",
    headers: { 
      "X-Idempotency-Key": idempotency_key,
      "Content-Type": "application/json",
    },
    body: bodyStr,
  });
}

export async function getExpenses({ category, sort } = {}) {
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  if (sort) params.set("sort", sort);
  const qs = params.toString();
  return request(`/expenses${qs ? `?${qs}` : ""}`);
}

export async function getCategories() {
  return request("/expenses/categories");
}

export { ApiError };
