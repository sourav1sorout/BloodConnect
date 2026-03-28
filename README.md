# 🩸 BloodConnect — Full-Stack Blood Donation Platform & Analytics System

> A production-ready MEAN stack blood donation platform connecting donors with patients in need, featuring a powerful Admin Dashboard and an end-to-end Data Analytics ETL pipeline.

![BloodConnect](https://img.shields.io/badge/MEAN%20Stack-Production%20Ready-red?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat-square)
![Angular](https://img.shields.io/badge/Angular-17-red?style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js-20-green?style=flat-square)
![Python](https://img.shields.io/badge/Python-Data%20Analytics-blue?style=flat-square)

---

## ✨ Key Features

### 🧑‍💻 For Full-Stack Developers
*   **Role-Based Access Control:** Secure JWT authentication for Admins, Donors, and Receivers.
*   **Advanced Admin Dashboard:**
    *   Real-time statistics and monthly trend visualization.
    *   Approve, reject, or suspend users with descriptive rejection reasons.
    *   **Audit Logging:** Every admin action is automatically tracked with timestamps.
    *   **Bulk Communication:** Built-in email tool to alert donors matching specific blood groups and cities via Nodemailer.
*   **Modern Frontend UI:** Built with Angular 17. Features fully responsive styling with custom CSS grids, flexbox, glassmorphism, and dynamic micro-animations.

### 📊 For Data Analysts & Engineers
*   **Python ETL Pipeline:** Custom Python script (`extract_data.py`) using `pymongo` and `pandas` to connect directly to the NoSQL database.
*   **Data Transformation:** Automatically merges User and Donor schemas, flattens deeply nested JSON structures (like addresses), drops sensitive salt/hash columns, and handles sparse datasets.
*   **Business Intelligence Ready:** The pipeline exports `donors_clean.csv` and `requests_clean.csv` — perfectly structured datasets ready to be dropped into Power BI, Tableau, or Excel for dashboarding.
*   **Admin CSV Export:** 1-click downloads of user and request data natively in the web browser.

---

## 📁 Project Structure

```text
BloodConnect/
├── backend/                     # Node.js + Express API
│   ├── controllers/             # Business logic (Auth, Donors, Requests, Admin)
│   ├── middleware/              # JWT Auth & Error Handling
│   ├── models/                  # Mongoose Schemas (User, Donor, BloodRequest, AuditLog)
│   ├── utils/                   # Nodemailer, DB Seeders
│   └── server.js                # App entry point
│
├── frontend/                    # Angular 17 SPA
│   ├── src/app/
│   │   ├── components/          # Reusable UI (Navbar, Toast, Modals)
│   │   ├── pages/               # Auth, Dashboards, Search, Registration
│   │   ├── services/            # API interaction layers
│   │   └── models/              # TypeScript interfaces
│   └── src/styles.scss          # Global design system
│
└── data-analytics/              # Data Pipeline (New!)
    ├── datasets/                # Generated clean CSV files
    ├── extract_data.py          # Python ETL Script
    └── requirements.txt         # Pandas, PyMongo
```

---

## 🚀 Quick Start Guide

### Prerequisites
*   Node.js v18+ & npm
*   MongoDB Atlas (or local MongoDB running on port 27017)
*   Angular CLI v17+
*   Python 3.10+ (for Data Pipeline)

### 1️⃣ Backend Setup
```bash
cd backend
npm install

# Setup environment variables
cp .env.example .env

# Seed the database with fake Donors and an Admin account
npm run seed

# Start the server (runs on http://localhost:5000)
npm run dev
```

### 2️⃣ Frontend Setup
```bash
cd frontend
npm install

# Start the Angular development server (runs on http://localhost:4200)
ng serve
```

### 3️⃣ Data Analytics Pipeline Setup
Open a new terminal to extract your database into clean CSVs for analysis.

```bash
cd data-analytics

# Create and activate virtual environment (Windows)
python -m venv venv
.\venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Run the ETL script
python extract_data.py
```
> ✅ You will now find `donors_clean.csv` inside `data-analytics/datasets/` ready for Power BI!

---

## 🔐 Default Demo Credentials

The `npm run seed` command automatically populates the database with these accounts:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@blooddonation.com` | `Admin@12345` |
| **Donor** | `donor1@example.com` | `Donor@12345` |
| **Receiver** | `receiver1@example.com` | `Receiver@12345` |

---

## 🔒 Security Implementations
- **Bcrypt** password hashing (12 rounds).
- **JWT** short-lived access tokens + long-lived HTTP-only refresh tokens.
- **Express-Rate-Limit** restricting excessive requests (100 req/15 min).
- **Mongoose Sanitization** to prevent NoSQL injection.
- **Role-based Guards** aggressively preventing unauthorized API and UI access.

---

## 📝 License
MIT License — Free to use, modify, and deploy. 

*Made with ❤️ and 🩸 to save lives.*
