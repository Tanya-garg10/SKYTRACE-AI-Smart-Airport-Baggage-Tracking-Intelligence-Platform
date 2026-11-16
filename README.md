# ✈️ SKYTRACE AI — Smart Airport Baggage Tracking & Intelligence Platform

> **"Every Bag. Every Journey. Always in Sight."**

SKYTRACE AI is an enterprise-ready, full-stack aviation baggage tracking and operational intelligence platform. Designed for **Passengers**, **Airport Ground Staff**, and **Operations Administrators**, it pairs digital baggage identities (QR + RFID EPC mapping) with real-time Socket.IO telemetry, browser-based camera scanning, and Gemini AI-driven delay and anomaly detection.

---

## 🌟 Key Features

### 👤 Passenger Portal
- **Real-Time Bag Tracking:** Track baggage journey across 8 airport checkpoints with live status updates.
- **Digital Boarding & Bag Passes:** View unique Baggage IDs, digital tags, and downloadable QR tags.
- **Incident Reporting:** File claims and track real-time resolution status for missing, delayed, or damaged baggage.
- **Instant Flight & Gate Information:** Live sync with departure gates, carousel numbers, and flight status.

### 👷 Staff Operations Portal
- **Camera QR Scanner & Manual Lookup:** Ultra-fast scanning using integrated webcam/mobile browser camera via `html5-qrcode`.
- **RFID Portal Simulation:** Integrated testing mode simulating industrial UHF RFID readers at critical baggage gates.
- **Checkpoint Progression Validation:** Built-in safeguards against invalid or out-of-order scans.
- **Instant Incident Resolution:** Process passenger reports and update investigation remarks in real time.

### 🛡️ Admin & Intelligence Command Center
- **Airport Digital Twin:** Interactive schematic map visualizing baggage flow across all 8 airport zones.
- **Live Operations Analytics:** Real-time throughput metrics, delay charts, and status breakdowns powered by Recharts.
- **AI Delay Risk & Anomaly Engine:** Identifies baggage dwell bottlenecks, flight departure proximity risks, and skipped checkpoints.
- **AI Operations Copilot:** Grounded natural-language query assistant for flight and baggage operations.
- **Data Export & Governance:** One-click CSV export, comprehensive audit trails, flight management, and staff account provisioning.

---

## 🏗️ System Architecture & Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Framer Motion, Recharts, Lucide Icons, `html5-qrcode` |
| **Backend** | Node.js, Express, TypeScript (`tsx`), Socket.IO (WebSocket telemetry), JWT & `bcryptjs` Auth |
| **Database** | Dual Mode: MongoDB / Atlas via Mongoose with automatic fallback to zero-config local persistent store (`./data/skytrace.db.json`) |
| **AI Intelligence** | Google Gemini API (`@google/genai`) for real-time risk scoring, sequence anomaly audits, and conversational copilot |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+ recommended)
- npm or bun

### 1. Clone & Install
```bash
git clone https://github.com/Tanya-garg10/SKYTRACE-AI-Smart-Airport-Baggage-Tracking-Intelligence-Platform.git
cd SKYTRACE-AI-Smart-Airport-Baggage-Tracking-Intelligence-Platform
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `.env` with your credentials:
```env
# Gemini API Key (Required for AI insights & Copilot)
GEMINI_API_KEY="your_gemini_api_key_here"

# Database Configuration (Optional: defaults to local JSON storage if left blank)
MONGODB_URI=""

# Security
JWT_SECRET="your-super-secret-jwt-key"
PORT=3000
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Both the Vite client and Express/Socket.IO backend run concurrently.

### 4. Production Build & Execution
```bash
npm run build
npm start
```

---

## 🔐 Demo Credentials

Test accounts are pre-seeded and ready to use immediately:

| Portal Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Passenger** | Elena Rostova | `passenger@skytrace.aero` | `SkyPass2026!` |
| **Airport Staff** | Marcus Vance | `staff@skytrace.aero` | `SkyStaff2026!` |
| **Administrator** | Dr. Aris Thorne | `admin@skytrace.aero` | `SkyAdmin2026!` |

> **Public Demo Sample Baggage IDs:** `DEMO-BAG-901`, `DEMO-BAG-902`, `DEMO-BAG-903`  
> **Seeded Live Baggage IDs (Staff/Passenger view):** `ST-2026-4810` through `ST-2026-4817`

---

## 🔄 Baggage Checkpoint Flow

```
[1. Check-In & Tagging]
         ↓
[2. Security & Screening]
         ↓
[3. Baggage Sortation System]
         ↓
[4. Apron Transfer / Cart Loading]
         ↓
[5. Aircraft Loading]
         ↓
[6. In-Flight Transfer / Transit]
         ↓
[7. Baggage Unloading at Destination]
         ↓
[8. Baggage Claim Carousel Ready]
```

---

## 📡 API Reference Overview

### 🔐 Authentication & Public
- `GET /api/health` — Service health, active DB mode, and AI availability status.
- `GET /api/public/stats` — Real-time aggregate baggage and airport metrics.
- `GET /api/public/demo-tracking/:bagId` — Public lookup for demo luggage tracking.
- `POST /api/auth/login` — Authenticate and generate session token.
- `POST /api/auth/register` — Passenger account registration.
- `GET /api/auth/me` — Current user context and profile.

### 🧳 Baggage Tracking & Checkpoints
- `GET /api/baggage` — Retrieve filtered baggage records (role-protected).
- `GET /api/baggage/track/:bagId` — Full journey timeline, flight association, and dynamic QR payload.
- `POST /api/baggage/register` — Register new luggage and generate QR + RFID metadata *(Staff/Admin)*.
- `POST /api/baggage/scan` — Process QR or simulated RFID checkpoint events and broadcast via WebSockets *(Staff/Admin)*.

### 🚨 Incident Reports & Real-Time Alerts
- `GET /api/reports` — Fetch list of filed baggage claims.
- `POST /api/reports` — Submit new damaged or lost luggage report.
- `PATCH /api/reports/:id` — Update report investigation status and resolution notes *(Staff/Admin)*.
- `GET /api/notifications` — Fetch user-specific notifications and alerts.
- `PATCH /api/notifications/:id/read` — Mark notification as acknowledged.

### 🧠 Operations Analytics & AI Copilot
- `GET /api/admin/overview` — High-level airport operational KPIs *(Admin)*.
- `GET /api/admin/analytics` — Detailed time-series, status distributions, and flight delay charts *(Admin)*.
- `GET /api/admin/export/csv` — Export baggage event logs as CSV *(Admin)*.
- `GET /api/ai/delay-risk` — AI assessment of high-risk bags approaching departure *(Staff/Admin)*.
- `GET /api/ai/anomalies` — Algorithmic and AI detection of out-of-order or missing scans *(Staff/Admin)*.
- `POST /api/ai/assistant` — Interactive grounded operations intelligence copilot *(Staff/Admin)*.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
