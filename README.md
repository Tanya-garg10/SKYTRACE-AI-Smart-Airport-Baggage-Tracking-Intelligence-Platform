# SKYTRACE AI — Smart Airport Baggage Tracking & Intelligence Platform

**Tagline:** *Every Bag. Every Journey. Always in Sight.*

SKYTRACE AI is a full-stack aviation baggage tracking and intelligence platform built for **Passengers**, **Airport Ground Staff**, and **Operations Administrators**. It pairs unique digital baggage identities (QR + RFID EPC mapping) with real-time Socket.IO telemetry, browser camera QR scanning, and AI-assisted delay/anomaly detection.

---

## Architecture Overview

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Framer Motion (`motion`), Recharts, Lucide Icons, `html5-qrcode`.
- **Backend:** Node.js, Express, TypeScript, Socket.IO, JWT + `bcryptjs` authentication, `qrcode` generator.
- **Database:** MongoDB via Mongoose schemas (`server/models/mongooseSchemas.ts`) with an automatic zero-config persistent local JSON store (`./data/skytrace.db.json`) when `MONGODB_URI` is not set.
- **AI Intelligence:** Server-side `@google/genai` (`gemini-4-hydrogen`) for delay risk analysis and grounded operations Q&A, paired with deterministic rule-based evaluation as a guaranteed fallback.

---

## Local Setup & Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env` and fill in your values as needed:
   ```env
   GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
   MONGODB_URI="" # Optional: MongoDB Atlas URI. Leave blank for automatic local persistent store.
   JWT_SECRET="replace-with-secure-secret"
   PORT=3000
   ```

3. **Run in development:**
   ```bash
   npm run dev
   ```
   The full-stack server and Vite frontend run together on `http://localhost:3000`.

4. **Production build & start:**
   ```bash
   npm run build
   npm start
   ```

---

## Demo Login Credentials

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Passenger** | Elena Rostova | `passenger@skytrace.aero` | `SkyPass2026!` |
| **Airport Staff** | Marcus Vance | `staff@skytrace.aero` | `SkyStaff2026!` |
| **Administrator** | Dr. Aris Thorne | `admin@skytrace.aero` | `SkyAdmin2026!` |

Public Landing Demo Sample IDs (isolated from live records): `DEMO-BAG-901`, `DEMO-BAG-902`, `DEMO-BAG-903`.
Live Seeded Bag IDs (accessible when signed in): `ST-2026-4810` through `ST-2026-4817`.

---

## API Documentation

### Public & Auth
- `GET /api/health` — Service health, active DB mode, and AI availability.
- `GET /api/public/stats` — Live database metrics for the landing page.
- `GET /api/public/demo-tracking/:bagId` — Sample demo journey lookup (`DEMO-BAG-*`).
- `POST /api/auth/register` — Register a passenger account.
- `POST /api/auth/login` — Authenticate and receive JWT token + cookie.
- `POST /api/auth/logout` — Clear session cookie.
- `GET /api/auth/me` — Retrieve authenticated user profile.

### Baggage & Scanning
- `GET /api/baggage` — Role-scoped baggage list (supports `?search=`, `?status=`, `?flightNumber=`).
- `GET /api/baggage/track/:bagId` — Full baggage details, flight info, recorded events, and QR DataURL.
- `POST /api/baggage/register` *(Staff/Admin)* — Register new baggage, generate Bag ID + QR + RFID EPC.
- `POST /api/baggage/scan` *(Staff/Admin)* — Record checkpoint scan (`QR_SCAN`, `RFID_READER`, or `MANUAL_STAFF`), validate transitions, and emit Socket.IO events/notifications.

### Reports & Notifications
- `GET /api/reports` — List missing/damaged baggage reports (role-scoped).
- `POST /api/reports` — Submit a missing or damaged baggage report.
- `PATCH /api/reports/:id` *(Staff/Admin)* — Update investigation status and resolution notes.
- `GET /api/notifications` — Retrieve user/role notifications with read state.
- `PATCH /api/notifications/:id/read` — Mark notification as read.

### Admin & AI Intelligence
- `GET /api/admin/overview` *(Admin)* — Operational KPI counts.
- `GET /api/admin/analytics` *(Admin)* — Chart series for flights, status breakdown, checkpoints, and time windows.
- `GET /api/admin/users` / `POST /api/admin/users/staff` / `PATCH /api/admin/users/:id` *(Admin)* — User & staff governance.
- `GET /api/admin/flights` / `POST /api/admin/flights` / `PATCH /api/admin/flights/:id` *(Admin)* — Flight management.
- `GET /api/admin/export/csv` *(Admin)* — Download CSV baggage report.
- `GET /api/ai/delay-risk` *(Staff/Admin)* — Delay risk scoring grounded in checkpoint dwell and departure proximity.
- `GET /api/ai/anomalies` *(Staff/Admin)* — Duplicate scan, skipped checkpoint, and sequence anomaly detection.
- `POST /api/ai/assistant` *(Staff/Admin)* — Grounded operations Q&A assistant.

---

## Implemented vs. Simulated / Future Integrations

- **Implemented End-to-End:**
  - Role-based authentication & authorization (Passenger, Staff, Admin).
  - Baggage registration with unique Bag IDs, QR code generation, and downloadable/printable PNG identification cards.
  - Browser camera QR code scanning (`html5-qrcode`) + manual Bag ID entry fallback.
  - 8-stage checkpoint progression with backward-transition validation and database persistence.
  - Real-time Socket.IO scan & notification broadcasting + read/unread Notification Center.
  - Missing & damaged baggage incident reporting and staff investigation workflow.
  - Admin Recharts analytics, user/staff/flight/checkpoint management, audit logs, and CSV export.
  - AI Delay Risk Analysis, Anomaly Detection, and grounded Operations Assistant with deterministic fallback.
- **Simulated / Illustrative:**
  - **RFID Reader Simulation Mode:** Clearly labeled simulation mode in the Staff Scanner that emits `RFID_READER` events into the same ingestion pipeline prepared for future UHF RFID portal hardware.
  - **Illustrative Terminal Map:** Interactive schematic visualization representing the 8 airport baggage zones without proprietary CAD/GIS airport floorplans.
