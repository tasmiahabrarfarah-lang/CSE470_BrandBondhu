# BrandBondhu - AI Branding & Marketing Automation Platform

BrandBondhu is a multi-role, AI-assisted branding and marketing automation Software as a Service (SaaS) platform tailored for small businesses and Facebook commerce (F-commerce) sellers in Bangladesh.

This workspace provides the core project skeleton built on the **MERN (MongoDB, Express, React, Node.js) Stack** using **Model-View-Controller (MVC) Architecture** for files and folder organization.

---

## Implemented Modules

1. **User and Account Management (FR-1 & FR-17)**
   - Role-Based Access Control (RBAC) for `Seller`, `Collaborator` (Staff), and `Designer` roles.
   - User Registration with simulated OTP email/phone verification.
   - User Login and session persistence using JSON Web Tokens (JWT).
   - Dynamic profile setups (Shop configuration for Sellers, Portfolio configuration for Designers).
   - Team / Collaborator Invite System (Sellers can invite staff members with restricted feature permissions).
   - Functional Account Deactivation and Permanent Account Deletion.
2. **Subscription & Payment Management (FR-10)**
   - Tiered plans configuration (Free, Basic, Premium, Enterprise).
   - Live AI credits meter with dynamic warning levels for low credits.
   - Interactive payment checkout wizards mimicking **bKash**, **Nagad**, and **Credit Card** portals (requires user OTP, phone validation, and PIN verification).
   - Automated transaction receipt logging and printable billing invoice renderer.
3. **Notification System (FR-11)**
   - In-app notification center that polls the server database periodically.
   - Transactional alerts (e.g. subscription upgrade notices, low-credits notifications).

---

## Directory Layout

```
BrandBondhu/
├── package.json                   # Root package (coordinates concurrent run commands)
├── README.md                      # Setup and deployment guidelines
├── backend/                       # Express server MVC application
│   ├── server.js                  # App bootstrap entry
│   ├── verify.js                  # Programmatic end-to-end API test script
│   ├── config/                    # Connection configurations
│   ├── models/                    # Mongoose data schemas
│   ├── controllers/               # Business logical routes implementation
│   ├── routes/                    # API endpoints routes
│   └── utils/                     # Email simulation utilities
└── frontend/                      # React SPA client application
    ├── src/
    │   ├── main.jsx               # Render bootstrap
    │   ├── App.jsx                # SPA path router & context wrap
    │   ├── index.css              # Custom styled premium design system
    │   ├── components/            # UI components (Layout, PaymentPortal, InvoicePDF)
    │   ├── context/               # State providers (AuthContext, NotificationContext)
    │   └── services/              # API wrapper client methods
    └── index.html                 # App layout configuration and SEO tags
```

---

## Local Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (Version 18+ recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) (Running locally or an Atlas connection URI)

### Quick Start Setup
You can set up and install all dependencies for the root, backend, and frontend with a single command:

1. Clone or download this project workspace.
2. Open your terminal in the root directory:
   ```bash
   npm run install-all
   ```
3. Run the application (starts both backend API at `5000` and frontend Vite dev server at `5173` concurrently):
   ```bash
   npm run dev
   ```
4. Access the application in your browser at: `http://localhost:5173`

---

## Running Automated Verification Tests
We have built an end-to-end verification script to validate all API routers:

1. Ensure MongoDB is running locally.
2. Run the test command in the root folder:
   ```bash
   npm run install-backend && cd backend && npm run test
   ```
3. The script will programmatically boot the server, trigger registrations, verify codes, perform credit deductions, execute payments, fetch notification history, clear test records, and print success logs.

---

## Deployment Guidelines (Vercel)

This project has been structured to easily deploy on Vercel as a monorepo or individual services.

### Backend Deployment
1. Import the project on Vercel.
2. Set the root directory to `backend/`.
3. Add the required environment variables:
   - `MONGO_URI`: Your MongoDB Atlas connection URI.
   - `JWT_SECRET`: A secure random secret string.
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: URL of your deployed frontend.

### Frontend Deployment
1. Import the project on Vercel.
2. Set the root directory to `frontend/`.
3. Select **Vite** as the build framework.
4. Set the Build Command to `npm run build`.
5. Add environment variables:
   - `VITE_API_URL`: The URL of your deployed backend (e.g. `https://your-backend.vercel.app/api`).
