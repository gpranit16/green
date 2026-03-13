# Deploying GreenCorridor to Production 🚀

The GreenCorridor system is now a full-stack application. To deploy it so anyone on the internet can use it (e.g. for a hackathon demo or public presentation), you will need to host your **React Frontend** and your **Node.js/Express Backend** separately.

Here is the easiest, completely free way to deploy both:

---

## 1. Prepare your Backend for Deployment

Before hosting your backend, we need to make sure the frontend knows how to talk to the live server instead of `localhost:5000`.

### A. Update `App.jsx` API URLs
In your `src/App.jsx` file, you need to change all fetch requests from `http://localhost:5000` to an environment variable or a relative path (if deployed together), or directly replace it with your future live backend URL.

For example, when you get your live backend URL (e.g., `https://green-corridor-api.onrender.com`), you will replace:
```js
fetch('http://localhost:5000/api/request')
```
with
```js
fetch('https://green-corridor-api.onrender.com/api/request')
```

*(You will need to do this for the GET, POST, and PUT requests in `App.jsx`)*

---

## 2. Deploy the Backend (Free on Render.com)

[Render](https://render.com/) is currently the best free platform for hosting Node.js servers, as Heroku no longer has a free tier.

**Steps:**
1. Upload your entire project code to a new repository on **GitHub**.
2. Go to [Render.com](https://render.com/) and sign up with GitHub.
3. Click **New +** and select **Web Service**.
4. Connect the GitHub repository containing your GreenCorridor code.
5. Setup the Web Service settings:
   - **Name**: `green-corridor-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
6. **Critical Step (Environment Variables):**
   - Scroll down to "Environment Variables" and add:
     - Key: `MONGO_URI`
     - Value: `mongodb+srv://pranit:pranit@corridor.2a0gnvi.mongodb.net/?appName=corridor`
7. Click **Create Web Service**. 
8. Render will deploy it within a few minutes. Copy the live URL they give you (you will need to paste this into your `App.jsx` as mentioned in Step 1).

---

## 3. Deploy the Frontend (Free on Vercel)

[Vercel](https://vercel.com/) is the absolute best place to host Vite/React frontends. It is incredibly fast and completely free.

**Steps:**
1. Make sure you have pushed all your latest code (including the updated `App.jsx` with the Render URL) to your **GitHub** repository.
2. Go to [Vercel.com](https://vercel.com/) and sign up with GitHub.
3. Click **Add New** -> **Project**.
4. Import your GreenCorridor GitHub repository.
5. Vercel will automatically detect that you are using Vite and React.
6. Check the root directory and settings (Vercel's default settings of Build Command: `npm run build` are perfect).
7. Click **Deploy**.

Vercel will give you a live functioning URL (e.g. `https://green-corridor-app.vercel.app`). 

---

## 4. Final Security Check (CORS)

Currently, your `server.js` has `app.use(cors());` which allows any website to talk to your API. Before a live production launch, you would restrict this to only allow your Vercel URL, but for a hackathon, `app.use(cors())` is perfect and prevents cross-origin errors!

### Testing the Live System
1. Go to your Vercel URL on your phone or laptop.
2. Request an ambulance.
3. Open a second tab to your Vercel URL and click the Hospital Portal.
4. If they sync instantly just like they did on your local computer, **your deployment was a 100% success!**
