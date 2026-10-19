# Feasy — Universal Membership, Subscription & Fee Management SaaS

A modern, mobile-responsive, white-label **SaaS platform for recurring membership, subscription, and fee management**. 

Easily switchable and configurable for any recurring membership niche:
- 🎓 **Education & Tuition Centers** (Students, Batches/Classes, Subjects/Courses, Parents)
- 🏋️‍♂️ **Gyms & Fitness Studios** (Members, Membership Tiers, Facilities & Personal Training, Emergency Contacts)
- 📚 **Libraries & Co-working Spaces** (Patrons, Access Tiers, Dedicated Desks & Meeting Rooms, Primary Contacts)
- 💼 **General SaaS & Recurring Clubs** (Subscribers, Plans, Add-ons & Services, Billing Contacts)

---

## Key Features

- **Multi-Niche Dynamic Terminology** — Change the business niche in **Settings** (or customize field labels directly), and the entire dashboard, navigation, tables, modals, and reminders update dynamically without touching code.
- **Tier-based Base Fee + Modular Add-ons** — Calculate monthly dues instantly based on base category/membership tier plus itemized add-on selections.
- **Subscription Runway & Renewal Engine** — Track live days remaining for every subscriber with intelligent active, expiring, and expired status buckets.
- **Anchor-Day Billing Preservation** — When recording monthly deposits, renewals preserve the member's original anchor day (e.g. 10th of every month) while incrementing the renewal period.
- **Membership Pause / Leave Support** — Pause members who take time off and restart their subscription cycle with a custom resumption date upon return.
- **Automated Multi-Channel Reminders** — Send WhatsApp (via Meta Cloud API) and SMS fee reminder notifications with dynamic variable substitution (`{{memberName}}`, `{{days}}`, `{{fee}}`, `{{renewDate}}`). Built-in simulator for testing without credentials.
- **Financial Analytics & Dues Dashboard** — Real-time revenue insights: Monthly Expected, Monthly Collected, Pending Dues, and Projected Yearly Outstanding.
- **White-Label & SaaS-Ready** — Zero hardcoded institute or developer names; organization names, currencies, lead times, and reminder templates are fully customizable from the web UI.

---

## Tech Stack

| Layer     | Technologies                                                         |
|-----------|----------------------------------------------------------------------|
| Frontend  | React 18, Vite 5, React Router 6, Recharts, Axios, Lucide Icons      |
| Backend   | Node.js (ESM), Express 4, Mongoose 8                                 |
| Database  | MongoDB (Local or MongoDB Atlas)                                     |
| Container | Docker multi-stage build (Production client + API in single image)   |

---

## Directory Structure

```
Feasy/
├── client/                 # React + Vite front-end
│   └── src/
│       ├── api/            # Axios client + REST endpoint services
│       ├── components/     # UI primitives, layout, charts, modals
│       ├── context/        # Dynamic Settings & Niche Preset Context
│       ├── hooks/          # useApi hook
│       ├── lib/            # Presets, constants, formatters
│       └── pages/          # Dashboard, Members, Plans, Payments, Reminders, Settings
├── server/                 # Express + Mongoose API
│   └── src/
│       ├── config/         # Environment variables & MongoDB connection
│       ├── controllers/    # API controllers
│       ├── middleware/     # 404, error handler
│       ├── models/         # Settings, ClassPlan, Subject, Student, Payment, ReminderLog
│       ├── routes/         # REST API routers
│       ├── services/       # WhatsApp Cloud API & SMS messaging adapters
│       ├── utils/          # Fee computation, date math, currency formatting
│       ├── seed/           # Demo data seeder
│       ├── app.js          # Express app definition & SPA static server
│       └── server.js       # Server bootstrap & connection listener
├── Dockerfile              # Multi-stage production container
├── docker-compose.yml      # Deployment compose file
└── package.json            # Root workspace scripts (concurrent dev)
```

---

## Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18+ (v20 LTS recommended)
- **MongoDB**: Local MongoDB instance or free MongoDB Atlas cluster

### 2. Install Dependencies
```bash
npm run install:all
```

### 3. Configure Server Environment
Create `server/.env` based on `server/.env.example`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/feasy
INSTITUTE_NAME="Feasy Workspace"
BUSINESS_TYPE="education"
CLIENT_URL=http://localhost:5173
```

### 4. (Optional) Seed Demo Data
```bash
npm run seed
```

### 5. Start Development Servers
Run both backend and frontend concurrently:
```bash
npm run dev
```
- Frontend UI: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- API Health: `http://localhost:5000/api/health`

---

## Production Deployment with Docker

Build and run the production image:
```bash
docker compose up -d --build
```
The server will start on port `5000`, serving both the REST API and the compiled React single-page application.

---

## License

Private / Commercial SaaS License. All rights reserved.
