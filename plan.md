# Dynamic Green Corridor System — Project Plan

## 🚨 Problem Statement (PS 2.3)

Emergency vehicles in urban cities face severe traffic congestion that delays response times, reducing survival chances during accidents, heart attacks, and other critical emergencies. There is no automated system to dynamically coordinate traffic signals for emergency vehicles.

---

## 🏗 System Architecture

```
User Request
    ↓
[User Portal] ─── selects hospital, submits request
    ↓
[Hospital Portal] ─── approves/rejects incoming request (MANDATORY)
    ↓
[Police Portal] ─── confirms escort (MANDATORY)
    ↓
[AI Routing Engine] ─── computes optimal route using Dijkstra
    ↓
[Traffic Control] ─── proximity-based signal preemption
    ↓
[Ambulance Movement] ─── live GPS tracking on Leaflet map
    ↓
[Hospital Reception] ─── ER bed + trauma team pre-alerted
```

---

## 🌐 Portals

| Portal | Role | Key Feature |
|--------|------|-------------|
| **User Portal** | Requester | Hospital dropdown (8 presets + custom), condition selector, contact info |
| **Hospital Portal** | Approve/Reject | Real-time incoming request, Accept/Redirect buttons (approval mandatory) |
| **Police Portal** | Confirm Escort | Alert after hospital approval, Confirm Escort triggers dispatch (mandatory) |
| **Ambulance Portal** | Driver | Turn-by-turn navigation, signal status feed |
| **Traffic Control Portal** | City Dashboard | Active corridors, signal analytics, manual override |

---

## 🧠 Traffic Control Algorithm

Located in `src/trafficAlgorithm.js`.

### 1. Proximity-Based Signal Preemption
- **PREEMPTION\_RADIUS** = 400 m: signals within this distance turn GREEN immediately
- **LOOKAHEAD\_RADIUS** = 1200 m: signals queued (yellow warning stage)
- Once a signal turns green, it stays green as the ambulance passes

### 2. Route Optimization (Dijkstra-based)
- Corridor route represented as weighted graph of waypoints
- Edge weights = expected signal delay (0s green, 5s queued, 30s red)
- `getOptimalRoute()` returns the lowest-cost path

### 3. ETA Calculation
- `computeETA(pos, remainingRoute, speedKmh, greenSignalCount)`
- Base drive time from haversine route distance at current speed
- Subtracts `greenSignalCount × 45s` (average red wait saved per preempted signal)

### 4. Cross-Traffic Safety
- `holdCrossTraffic()` forces RED on all perpendicular signals
- Hold duration: **12 seconds** before + 5s overlap after ambulance passes
- Prevents side-collision risk during preemption

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm

### Install & Run
```bash
cd green-corridor-app
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Environment Variables (`.env`)
```
VITE_MAPS_API_KEY=your_google_maps_api_key
```

> Note: The simulation uses OpenStreetMap via CARTO (no API key needed). Google Maps API is for production GPS integration.

---

## 🔁 Full Request Flow Demo

1. **Landing page** → Click **"Request Ambulance"**
2. Fill the form:
   - Location (pre-filled with Silk Board)
   - Select a hospital from dropdown (e.g., *Manipal Hospital, Old Airport Road*)
   - Patient condition (Critical / Moderate / Mild)
   - Contact number
3. Submit → status changes to **"Waiting for Hospital Approval"**
4. Click **"Hospital"** in navbar OR **"Open Hospital Portal"** portal card
5. The incoming request appears → click **"Accept Request"**
6. User modal updates to **"Police Escort Confirmation"**
7. Click **"Police"** in navbar OR **"Open Police Portal"** portal card
8. Alert appears (only visible after hospital accepts) → click **"Confirm Escort & Dispatch"**
9. Ambulance dispatches → live Leaflet map tracking begins with green corridor activation
10. 4 traffic signals turn green progressively as ambulance approaches

---

## 📁 File Structure

```
src/
├── App.jsx                 # Main landing page + state management
├── AmbulanceSimulation.jsx # User portal + live map tracking
├── HospitalPortal.jsx      # Hospital approval dashboard
├── PolicePortal.jsx        # Police escort confirmation
├── trafficAlgorithm.js     # Signal preemption + Dijkstra routing
├── index.css               # Design system (dark cinematic)
└── main.jsx                # React entry point
```

---

## 🚀 Future Enhancements

- Real WebSocket backend (Node.js + Socket.IO) for true real-time sync between portals
- Google Maps Directions API for live route recalculation
- SMS/push notifications to driver and kin
- Multi-ambulance corridor management
- Historical analytics dashboard for signal efficiency
