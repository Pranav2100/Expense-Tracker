💰Expense Tracker

A minimal full-stack personal finance tool built to simulate real-world usage conditions such as retries, refreshes, and unreliable networks.
This project focuses on correctness, simplicity, and production-like design decisions rather than feature overload.


🚀 Live Demo

🌐 Frontend: https://expense-tracker-eight-ebon-83.vercel.app

🔗 Backend API: https://expense-tracker-bca2.onrender.com

📌 Features

✅ Core Functionality
Add a new expense (amount, category, description, date)
View list of expenses
Filter expenses by category
Sort expenses by date (newest first)
View total of visible expenses

🌍 Real-World Behavior Handling
Handles multiple form submissions safely
Works correctly on page refresh
Designed to tolerate network retries
Backend prevents inconsistent data

✨ Nice-to-Have Features
Input validation (no negative amount, required fields)
Error handling in UI
Loading states
Backend test cases (Jest)

🏗️ Tech Stack
Backend
Node.js
Express.js
File-based storage (JSON)
Frontend
React (Vite)
Fetch API

📁 Project Structure

FENMO/
│
├── backend/
│ ├── data/ # JSON storage
│ ├── src/
│ │ ├── tests/
│ │ ├── db.js
│ │ ├── expenses.model.js
│ │ ├── expenses.router.js
│ │ └── index.js
│ ├── package.json
│ └── jest.config.json
│
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ ├── api.js
│ │ ├── App.jsx
│ │ ├── hooks.js
│ │ ├── utils.js
│ │ └── styles.css
│ ├── index.html
│ ├── vite.config.js
│ └── package.json
│
└── README.md


⚙️ Setup Instructions

1️⃣ Clone Repository
git clone https://github.com/Pranav2100/Expense-Tracker
cd FENMO

2️⃣ Run Backend
cd backend
npm install
npm run dev

Backend runs at:
👉 http://localhost:3001

3️⃣ Run Frontend
cd frontend
npm install
npm run dev

Frontend runs at:
👉 http://localhost:5173

🔌 API Endpoints
➕ Create Expense
POST /expenses

Request Body

{
  "amount": 500,
  "category": "Food",
  "description": "Lunch",
  "date": "2026-04-24"
}

📄 Get Expenses
GET /expenses

Query Parameters

category=Food
sort=date_desc

💾 Data Model
{
  "id": "uuid",
  "amount": 500,
  "category": "Food",
  "description": "Lunch",
  "date": "2026-04-24",
  "created_at": "timestamp"
}

🧠 Key Design Decisions

1. Storage Choice
Used JSON file storage
Reason:
Lightweight and simple for assignment
No external DB setup required
Easy debugging

2. Handling Real-World Issues
Backend designed to safely handle:
Duplicate submissions
Retries
Refresh scenarios

3. Money Handling
Amount stored as number
In production:
Would use integer (paise) or decimal library
Avoid floating point errors

4. Clean Architecture
Router → API layer
Model → business logic
DB → persistence