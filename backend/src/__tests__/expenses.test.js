process.env.DB_PATH = ":memory:";

const request = require("supertest");
const app = require("../index");

const validExpense = {
  amount: 150.5,
  category: "Food",
  description: "Lunch at office",
  date: "2024-01-15",
};

describe("POST /expenses", () => {
  test("creates a new expense and returns 201", async () => {
    const res = await request(app).post("/expenses").send(validExpense);
    expect(res.status).toBe(201);
    expect(res.body.expense).toMatchObject({
      amount: 150.5,
      category: "Food",
      description: "Lunch at office",
      date: "2024-01-15",
    });
    expect(res.body.expense.id).toBeDefined();
  });

  test("returns 422 for negative amount", async () => {
    const res = await request(app).post("/expenses").send({ ...validExpense, amount: -50 });
    expect(res.status).toBe(422);
  });

  test("returns 422 for zero amount", async () => {
    const res = await request(app).post("/expenses").send({ ...validExpense, amount: 0 });
    expect(res.status).toBe(422);
  });

  test("returns 422 for invalid category", async () => {
    const res = await request(app).post("/expenses").send({ ...validExpense, category: "InvalidCategory" });
    expect(res.status).toBe(422);
  });

  test("returns 422 for future date", async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const res = await request(app).post("/expenses").send({ ...validExpense, date: futureDate.toISOString().split("T")[0] });
    expect(res.status).toBe(422);
  });

  test("idempotency: same key returns 200 and same expense", async () => {
    const key = `test-key-${Date.now()}`;
    const res1 = await request(app).post("/expenses").set("X-Idempotency-Key", key).send(validExpense);
    expect(res1.status).toBe(201);

    const res2 = await request(app).post("/expenses").set("X-Idempotency-Key", key).send(validExpense);
    expect(res2.status).toBe(200);
    expect(res2.body.expense.id).toBe(res1.body.expense.id);
  });
});

describe("GET /expenses", () => {
  test("returns expenses list with meta", async () => {
    const res = await request(app).get("/expenses");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.expenses)).toBe(true);
    expect(res.body.meta).toBeDefined();
    expect(typeof res.body.meta.total).toBe("number");
  });

  test("filters by category", async () => {
    await request(app).post("/expenses").send({ ...validExpense, category: "Transport", description: "Taxi" });
    const res = await request(app).get("/expenses?category=Transport");
    expect(res.body.expenses.every((e) => e.category === "Transport")).toBe(true);
  });
});

describe("GET /expenses/categories", () => {
  test("returns list of categories", async () => {
    const res = await request(app).get("/expenses/categories");
    expect(res.status).toBe(200);
    expect(res.body.categories).toContain("Food");
  });
});

describe("GET /health", () => {
  test("returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
