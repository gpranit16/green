# Dynamic Green Corridor System — PPT Content

> Use this markdown as your master script for PowerPoint / Google Slides / Canva.
> Recommended deck length: **12–14 slides** (8–10 minutes).

---

## Slide 1 — Title Slide

**Title:** Dynamic Green Corridor System  
**Subtitle:** AI-Assisted Emergency Mobility for Smart Cities  
**Tagline:** *When every second counts, traffic should move for life.*

**Present by:** Team Name / Members  
**Event:** Smart City Hackathon  
**Date:** March 2026

**Visual suggestion:** Night city map + glowing ambulance corridor line.

**Speaker note (short):**
- Today we present a real-time emergency response system that coordinates hospital, police, and traffic flow to reduce ambulance delay.

---

## Slide 2 — Problem Statement

**Headline:** Urban congestion is costing lives.

- Ambulances lose critical minutes in dense traffic.
- Manual signal control is inconsistent and slow.
- Hospitals and police operate in separate workflows.
- Golden-hour outcomes drop when response is delayed.

**PS Mapping:** Problem Statement 2.3 — Dynamic traffic coordination for emergency vehicles.

**Speaker note:**
- The challenge is not just routing. It is inter-agency coordination under time pressure.

---

## Slide 3 — Our Solution (One-Liner + Core Flow)

**One-liner:** A multi-portal emergency orchestration platform that creates a live green corridor from pickup to hospital.

**Core flow:**
1. User submits emergency request.
2. Hospital approves/rejects (mandatory gate).
3. Police confirms escort (mandatory gate).
4. AI route + signal preemption activates.
5. Ambulance moves with live tracking to hospital.

**Visual suggestion:** Horizontal pipeline with 5 steps.

---

## Slide 4 — System Architecture

**Architecture stack:**
- **Frontend:** React + Vite + Leaflet map simulation
- **Backend:** Node.js + Express REST APIs
- **Database:** MongoDB Atlas (request lifecycle persistence)
- **Notifications:** Resend email integration (lifecycle updates)

**Request lifecycle statuses:**
- `WAITING_HOSPITAL` → `WAITING_POLICE` → `ASSIGNED` → `TRACKING` → `ARRIVED`
- Terminal states: `REJECTED`, `CANCELLED`

**Visual suggestion:** Layered architecture (UI, API, DB, Notification).

---

## Slide 5 — 5-Portal Ecosystem

| Portal | Actor | Responsibility |
|---|---|---|
| User Portal | Citizen/Requester | Submit emergency request, select hospital, start journey |
| Hospital Portal | Hospital Ops | Approve/redirect, assign doctor/room, prepare ER |
| Police Portal | Traffic Unit | Confirm escort and authorize corridor |
| Ambulance View | Driver/Control | Navigation + progress + signal state |
| Traffic Control View | City Ops | Corridor analytics and signal behavior |

**Speaker note:**
- We intentionally model real stakeholders to avoid a “single-screen simulation” trap.

---

## Slide 6 — AI Traffic & Signal Intelligence

**Algorithms in action:**
- Proximity-based signal preemption around ambulance path.
- Look-ahead signal queueing for smoother progression.
- Route candidate scoring based on estimated delay.
- ETA computation with congestion and preemption savings.

**Current logic highlights:**
- Green corridor activation around the active emergency route.
- Dynamic reroute alerts when route quality drops.
- Cross-traffic safety handling in simulation.

---

## Slide 7 — Priority Conflict Innovation (Demo Highlight)

**New demo capability:** Multi-ambulance conflict handling at shared signals.

- Added a **second demo ambulance** with **mild priority**.
- If both ambulances approach the same signal window:
  - More critical case gets immediate preemption.
  - Mild-priority ambulance yields temporarily.
- Live banner explains winner + reason in real time.

**Why this matters:**
- Real cities often have concurrent emergency requests.
- Priority arbitration is essential for scalable corridor systems.

---

## Slide 8 — Notification Reliability (User Trust Layer)

**Lifecycle email updates (Resend):**
1. **Hospital Approved** — includes hospital and ambulance details.
2. **Tracking Started** — includes live tracking link.

**Reliability improvements implemented:**
- Exactly-once email flags in backend (`notificationsSent.*`).
- Status update success validation before UI transitions.
- Fallback trigger at assignment stage if first lifecycle send was missed.

**Impact:** Users receive meaningful updates at critical journey milestones.

---

## Slide 9 — End-to-End Demo Script (Live Pitch Flow)

1. Open User Portal and submit request (critical case).
2. Show `WAITING_HOSPITAL` state.
3. Approve in Hospital Portal.
4. Confirm in Police Portal.
5. Show live map: route, signals, ETA, congestion overlays.
6. Trigger/observe two-ambulance signal conflict arbitration.
7. Show arrival and journey completion state.
8. Mention two lifecycle emails sent to requester.

**Presenter tip:** Keep this sequence under 3 minutes.

---

## Slide 10 — Measured/Expected Outcomes

**Simulation-level outcomes:**
- Faster emergency traversal via preemptive signal coordination.
- Reduced red-light waiting overhead on corridor path.
- Better coordination between hospital and police gates.
- Improved requester confidence via lifecycle communication.

**Dashboard-style KPIs to show:**
- ETA reduction trend
- Signals preempted per trip
- Time saved estimate
- Request-to-dispatch latency

> Note: Label values as demo/simulation unless sourced from live city trials.

---

## Slide 11 — Deployment & Scalability

**Current deployment model:**
- Frontend deployable on Vercel
- Backend deployable on Render
- MongoDB Atlas for persistent records

**Production readiness steps:**
- WebSocket event pipeline (real-time portal sync)
- Traffic signal API integrations with city infrastructure
- GPS telemetry from ambulance devices
- Role-based auth + audit logs for control portals

---

## Slide 12 — Business + Civic Impact

**For citizens:** faster response, better transparency.  
**For hospitals:** structured pre-arrival prep and triage readiness.  
**For police/traffic units:** centralized, actionable control.  
**For city governance:** measurable emergency mobility metrics.

**Policy alignment:** Smart City, emergency resilience, and digital public infrastructure goals.

---

## Slide 13 — Roadmap (Next 90 Days)

**Phase 1 (0–30 days):**
- Harden APIs, auth, observability, role controls.
- Notification analytics and delivery dashboard.

**Phase 2 (30–60 days):**
- Live telemetry ingestion (GPS + siren events).
- Multi-ambulance scheduler with city-zone balancing.

**Phase 3 (60–90 days):**
- Pilot with selected corridors/hospitals.
- Baseline vs post-deployment impact study.

---

## Slide 14 — Closing / Ask

**Closing line:**
- We are not just optimizing routes. We are orchestrating a city’s response to save lives.

**Ask from judges/stakeholders:**
- Pilot access with one hospital cluster + traffic command unit.
- Mentorship on civic integrations and procurement pathways.
- Support for real-world validation with emergency agencies.

**Thank you**  
Q&A

---

## Optional Appendix Slides

### A1 — Technical Stack Snapshot
- React, Vite, Leaflet, Node.js, Express, MongoDB
- Resend Email API
- Modular signal and routing algorithm layer

### A2 — API Endpoints (High-Level)
- `POST /api/request`
- `GET /api/request/active`
- `PUT /api/request/:id/status`
- `GET /api/request/history`

### A3 — Risk & Mitigation
- API downtime → failover + retries
- Notification miss → dedupe flags + fallback trigger
- Concurrent emergencies → priority arbitration logic
- Data integrity → strict status machine + server-side checks

---

## Slide Design Guidance (Use with your template)

- Keep dark background + neon accents (green/cyan/indigo).
- Use one key message per slide, max 4 bullets.
- Use consistent iconography for each stakeholder.
- Prefer diagrams over long text blocks.
- Keep font hierarchy strong: Title > Insight > Supporting detail.

