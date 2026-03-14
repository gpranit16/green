<div align="center">

```
╔══════════════════════════════════════════════════════════════╗
║         DYNAMIC GREEN CORRIDOR SYSTEM                       ║
║         AI-Assisted Emergency Mobility for Smart Cities     ║
╚══════════════════════════════════════════════════════════════╝
```

**_"When every second counts, traffic should move for life."_**
</div>

---

## 🚑 What is the Dynamic Green Corridor System?

The **Dynamic Green Corridor System** is a real-time emergency orchestration platform that creates a **live green corridor** from patient pickup to hospital delivery.

It coordinates:

- User emergency request intake
- Hospital approval (Gate 1)
- Police escort confirmation (Gate 2)
- AI-assisted routing + traffic signal preemption simulation
- Live trip tracking and lifecycle notifications

> Built for **Smart City Hackathon (March 2026)** · Problem Statement **2.3 — Dynamic Traffic Coordination for Emergency Vehicles**.

---

## 🔥 The Problem

In critical emergencies, delays happen because systems are disconnected:

| Problem | Impact |
|---|---|
| Ambulances face normal traffic congestion | Delayed medical intervention |
| Hospital readiness is not confirmed early | Lost triage preparation time |
| Families get limited journey visibility | Low transparency and high anxiety |
| Police / hospital / routing are siloed | Slow, manual coordination |

---

## ✅ Our Solution

A unified, multi-portal flow:

1. **User submits emergency request**
2. **Hospital approves/rejects** (mandatory)
3. **Police confirms/cancels escort** (mandatory)
4. **Ambulance route + green corridor simulation activates**
5. **Lifecycle notifications are sent to requester email**

```text
User submits request -> Hospital approves -> Police confirms -> Tracking starts -> Arrival
```

---

## 🔄 How It Works (Current Project Flow)

```text
WAITING_HOSPITAL -> WAITING_POLICE -> ASSIGNED -> TRACKING -> ARRIVED
                     |                              |
                     v                              v
                  REJECTED                       CANCELLED
```

### Step 1 — User Portal (`#simulation`)

User submits:

- Location
- Condition (critical / moderate / mild)
- Contact number (optional)
- Notification email (required)
- Patient name (optional)
- Hospital selection

Request is created with status `WAITING_HOSPITAL`.

### Step 2 — Hospital Portal (`#hospital`) [Gate 1]

Hospital operator reviews and either:

- **Accept** → status becomes `WAITING_POLICE`
- **Reject** → status becomes `REJECTED`

On successful accept transition, backend triggers lifecycle email #1:

- **Subject:** `Green Corridor: Hospital Approved Your Request`

### Step 3 — Police Portal (`#police`) [Gate 2]

Police operator either:

- **Confirm escort** → status becomes `ASSIGNED`
- **Cancel** → status becomes `CANCELLED`

### Step 4 — Tracking starts (`TRACKING`)

When journey tracking starts from simulation:

- status becomes `TRACKING`
- green corridor simulation becomes active
- lifecycle email #2 is triggered:
  - **Subject:** `Green Corridor: Live Tracking Started`

### Step 5 — Arrival

Status becomes `ARRIVED` and the active journey closes.

---

## 🖥️ Portal Overview

| Portal | Purpose |
|---|---|
| **User (Simulation)** | Submit request + watch tracking map |
| **Hospital** | Gate 1 approval/rejection |
| **Police** | Gate 2 escort confirmation/cancellation |
| **Ambulance View** | Integrated inside simulation tracking UI |
| **Traffic Control View** | Integrated map analytics/heat/conflict elements in simulation |

> In current implementation, traffic control and ambulance visuals are presented inside `AmbulanceSimulation.jsx` during tracking.

---

## ⚡ Key Features in This Codebase

- Real-time-ish portal sync via backend polling
- Mandatory hospital and police approval chain
- AI route candidate + congestion visualization
- Signal preemption simulation
- Multi-ambulance priority conflict demo (critical vs mild)
- Lifecycle notification reliability:
  - exactly-once flags in DB (`notificationsSent.*`)
  - fallback trigger safety for hospital-approved notification
  - portal badges showing notification sent/pending state

---

## 🗺️ Architecture

```text
Frontend (React + Vite + Leaflet)
  -> User/Hospital/Police/Tracking UI
  -> Polling API integration

Backend (Node.js + Express)
  -> Request lifecycle APIs
  -> Status transitions
  -> Notification triggers (Resend)

MongoDB Atlas
  -> Request persistence
  -> lifecycle + notification flags
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Leaflet, React-Leaflet, Lucide |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB Atlas |
| Notifications | Resend Email API (active), Twilio helper (optional) |
| Deployment | Vercel (frontend), Render (backend) |

---

## 📁 Project Structure (Actual)

```text
green-corridor-app/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── AmbulanceSimulation.jsx
│   │   ├── HospitalPortal.jsx
│   │   ├── PolicePortal.jsx
│   │   ├── trafficAlgorithm.js
│   │   └── ...
│   ├── package.json
│   └── .env
├── package.json   (workspace root)
└── DEPLOYMENT.md
```

---

## 🚀 Local Setup

### Prerequisites

- Node.js 18+
- npm
- MongoDB Atlas URI
- Resend API key

### 1) Clone

```bash
git clone https://github.com/gpranit16/green.git
cd green-corridor-app
```

### 2) Install dependencies

```bash
npm install
```

### 3) Configure backend env (`backend/.env`)

```env
MONGO_URI=your_mongodb_atlas_uri
PORT=5050
CORS_ORIGINS=http://localhost:5173,https://your-frontend-domain.vercel.app

# Resend (required for lifecycle emails)
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL=Green Corridor <onboarding@resend.dev>

# Optional Twilio (if using SMS)
# SMS_PROVIDER=twilio
# TWILIO_ACCOUNT_SID=...
# TWILIO_AUTH_TOKEN=...
# TWILIO_FROM_NUMBER=+1xxxxxxxxxx
```

### 4) Configure frontend env (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:5050
```

### 5) Run app

Option A (both at once from root):

```bash
npm run dev
```

Option B (separate terminals):

```bash
npm run dev -w backend
npm run dev -w frontend
```

Open: `http://localhost:5173`

---

## 🌐 Portal URLs (Current)

This app uses hash-based portal views:

- Simulation/User: `http://localhost:5173/#simulation`
- Hospital: `http://localhost:5173/#hospital`
- Police: `http://localhost:5173/#police`

---

## 🔌 API Reference (Current)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend health |
| `POST` | `/api/request` | Create emergency request |
| `GET` | `/api/request/active` | Get active request |
| `GET` | `/api/request/history` | Get request history |
| `PUT` | `/api/request/:id/status` | Update request status |
| `POST` | `/api/request/clear-active` | Clear active request(s) |
| `POST` | `/api/request/clear-history` | Clear history records |
| `POST` | `/api/email/test` | Test email delivery via Resend |

---

## 📬 Notification Behavior

Lifecycle emails currently implemented:

1. **Hospital approved** (`WAITING_POLICE`)
2. **Tracking started** (`TRACKING`)

Reliability controls:

- `notificationsSent.hospitalApprovedAt`
- `notificationsSent.trackingStartedAt`

These prevent duplicate lifecycle sends and power SENT/PENDING indicators in portals.



Minimum Render backend env vars:

- `MONGO_URI`
- `CORS_ORIGINS`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Vercel frontend env var:

- `VITE_API_BASE_URL=https://your-render-backend-domain`

---

## 📄 License

MIT (add `LICENSE` file if not already present).

---

<div align="center">

Built with purpose for Smart City Hackathon 2026.

</div>
