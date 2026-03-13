# GreenCorridor Deployment Guide 🚀

This project is a monorepo with:

- `frontend/` → Vite + React app
- `backend/` → Node + Express + MongoDB API

For reliable production deployment, host backend and frontend separately.

---

## 1) Prerequisites

- GitHub repo with latest code
- MongoDB Atlas database URI
- (Optional) Twilio account for SMS notifications

---

## 2) Deploy Backend (Render)

Create a **Web Service** on Render and point it to this repo.

### Render settings

- **Root Directory**: `backend`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Required environment variables

- `MONGO_URI=<your_mongodb_uri>`

### Recommended environment variables

- `PORT=5050`
- `CORS_ORIGINS=https://<your-frontend-domain>`

### Optional SMS variables (Twilio)

- `SMS_PROVIDER=twilio`
- `TWILIO_ACCOUNT_SID=...`
- `TWILIO_AUTH_TOKEN=...`
- `TWILIO_FROM_NUMBER=+1XXXXXXXXXX`
   - (`TWILIO_PHONE_FROM` is also accepted for compatibility)

### Health check

After deploy, verify:

- `https://<your-backend-domain>/api/health`

Should return JSON with `success: true`.

---

## 3) Deploy Frontend (Vercel)

Create a **Project** on Vercel using the same repo.

### Vercel settings

- **Root Directory**: `frontend`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Frontend environment variables

- `VITE_API_BASE_URL=https://<your-backend-domain>`

Then deploy.

---

## 4) Post-deploy verification checklist

1. Open frontend URL
2. Submit ambulance request
3. Open `#hospital` portal and verify incoming request appears
4. Accept in hospital, then open `#police` and confirm escort
5. Verify status lifecycle updates and records in both portals
6. Refresh on `#hospital` / `#police` and confirm portal state remains accessible

---

## 5) Production notes

- API fallback in frontend tries nearby localhost ports in dev, but in production always set `VITE_API_BASE_URL`.
- Keep `.env` files out of git.
- Regenerate any keys that were ever shared publicly.
- If SMS is not needed, leave `SMS_PROVIDER` unset.

---

## 6) Common issues

- **No data / inconsistent records**: frontend pointing to wrong backend URL → fix `VITE_API_BASE_URL`
- **CORS errors**: missing frontend domain in `CORS_ORIGINS`
- **SMS not sending**: provider vars incomplete or invalid Twilio credentials
