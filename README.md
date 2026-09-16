# ServeConnect — Hyper-Local Service Professional Marketplace

> **UCS503P - Software Engineering Project (2026-27 ODD)**  
> Thapar Institute of Engineering and Technology

ServeConnect is an Urban Company-style hyper-local platform connecting customers with verified local service professionals (Plumbers, Electricians, Carpenters, Painters, Cleaners, and AC Repair experts).

---

## 👥 Team Members & Roles

| Roll No. | Name | Primary Role | Core Contributions |
| :--- | :--- | :--- | :--- |
| **1024170415** | **Vijay Kiran** | Backend & Database | REST APIs, MongoDB Schemas, Booking Double-Booking Prevention, Database Seeding |
| **1024170233** | **Pratham Goyal** | Team Lead & Admin | Admin Verification Engine, Twilio SMS Service, Integration & Jest E2E Tests |
| **1024170318** | **Keshav Goyal** | Frontend UI/UX | React UI Components, Zomato-Style Location Context, Bookings & Registration Dashboards |

---

## ✨ Key Features

- **🔐 Role-Based JWT Authentication:** Secure login & registration for Customers, Workers, and Admins.
- **📍 Global Location Selector:** Zomato-style location picker with browser Geolocation auto-detection and interactive city switching (Patiala, Delhi, Chandigarh, Ludhiana).
- **🔎 Dynamic Worker Search & Ranking:** Search professionals by service category and location with rating-based ranking.
- **🛡️ Admin Worker Verification:** New workers require Admin review before becoming publicly visible.
- **📱 Automated SMS Notifications:** Integrated Twilio API dispatches SMS notifications to workers upon approval.
- **📅 Double-Booking Prevention:** Backend validation engine prevents schedule overlaps for busy workers.
- **📋 Interactive Bookings Dashboard:** Stateful job request dashboard allowing workers to Accept, Decline, or Mark Complete.

---

## 🛠️ Tech Stack

- **Frontend:** React.js, Vite, React Router DOM, Context API, Custom CSS
- **Backend:** Node.js, Express.js, JWT (`jsonwebtoken`), Bcrypt.js
- **Database:** MongoDB Atlas / Local MongoDB via Mongoose ORM
- **Testing:** Jest, Supertest (Integration & E2E Tests)
- **Third-Party APIs:** Twilio SDK (SMS Notifications), Nominatim/OpenStreetMap (Reverse Geocoding)

---

## 📁 Project Structure

```text
UCS503P-2026-27-Local-Hands/
├── code/
│   ├── backend/                # Express REST API Server
│   │   ├── config/             # DB Connection & Configuration
│   │   ├── controllers/        # Auth, Worker, Admin & Booking Controllers
│   │   ├── middleware/         # JWT Auth & Role Middleware
│   │   ├── models/             # Mongoose Schemas (User, Worker, Booking)
│   │   ├── routes/             # Express API Routes
│   │   ├── services/           # SMS & External Integrations
│   │   ├── tests/              # Jest Integration Test Suites
│   │   ├── createAdmin.js      # One-click Admin Setup Script
│   │   └── seed.js             # Database Seeding Script (20 Workers across 4 Cities)
│   └── frontend/               # Vite + React Client App
│       └── src/
│           ├── components/     # Navbar, Footer, Protected Route Wrappers
│           ├── context/        # AuthContext & LocationContext
│           ├── pages/          # Home, Search, Bookings, Login, Register, AdminDashboard
│           └── services/       # Axios/Fetch API Integration Modules
├── docs/                       # Project Documentation & Architecture Plans
├── journals/                   # Member Sprint Journals (Weeks 1 to 6)
└── README.md
```

---

## 🚀 Getting Started & Setup Guide

### 1. Backend Setup

```bash
cd code/backend
npm install

# Create environment file (.env)
# Set MONGO_URI, JWT_SECRET, PORT=5000, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE

# Seed Database with 20 Workers across 4 Cities
node seed.js

# Create Admin Account (admin@serveconnect.com / Admin@1234)
node createAdmin.js

# Start Backend API Server
npm start
```

### 2. Frontend Setup

```bash
cd code/frontend
npm install

# Create environment file (.env)
# VITE_API_URL=http://localhost:5000

# Start Vite Development Server
npm run dev
```

---

## 🔑 Quick Demo Credentials

| Role | Email | Password | Access / Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@serveconnect.com` | `Admin@1234` | Full Admin Panel access (`/admin`) to approve/reject pending workers |
| **Customer** | `vijayakiranyarra@gmail.com` | `123456` | Search workers by location, book time slots, view booking status |

---

## 🧪 Running Automated Tests

```bash
cd code/backend
npm test
```

---

## 📜 License & Acknowledgements

Developed for **UCS503P (Software Engineering Project)**, Thapar Institute of Engineering and Technology.
