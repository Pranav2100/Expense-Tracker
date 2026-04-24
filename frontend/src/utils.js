export const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export const formatDate = (dateStr) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const CATEGORY_COLORS = {
  Food: "#e67e22",
  Transport: "#3498db",
  Housing: "#27ae60",
  Entertainment: "#9b59b6",
  Healthcare: "#e74c3c",
  Shopping: "#f39c12",
  Utilities: "#1abc9c",
  Education: "#2980b9",
  Other: "#95a5a6",
};
