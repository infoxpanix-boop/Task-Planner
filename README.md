# Study Task Progress — Planner

A weekly study planner (calendar, time-slot grid, important tasks, progress
stats) built with React + Express + MongoDB. Each user has their own account
and their own private set of tasks.

## Project structure

```
frontend/    React app (Vite)
backend/     Express API + Mongoose models (used for local dev via `server.js`)
api/         Vercel serverless entry point ([...path].js wraps the same Express app)
vercel.json  Vercel build config
```

In production (Vercel) the frontend is served as a static build and every
`/api/*` request is handled by a single serverless function
(`api/[...path].js`) that reuses the same Express app defined in
`backend/app.js`. Locally, `backend/server.js` runs that same app as a plain
Node HTTP server.

## Auth model

- Email/password accounts (`bcryptjs` hashed passwords).
- A JWT is issued on signup/login and stored in an `httpOnly` cookie
  (`planner_token`), so the browser never touches the token directly.
- Every task, completion, and important-task document is scoped to the
  logged-in user's `userId` — one account can never see another's data.
- New accounts start with an empty planner (no demo/default tasks).

## Local development

1. **Install dependencies** (root is an npm workspace covering both
   `frontend` and `backend`):
   ```bash
   npm install
   ```

2. **Configure the backend.** Copy `backend/.env.example` to `backend/.env`
   and fill in:
   - `MONGODB_URI` — a MongoDB Atlas connection string (or any MongoDB
     instance).
   - `JWT_SECRET` — a long random string, e.g. `openssl rand -hex 48`.
   - `PORT` — defaults to `4000`.

3. **Run both servers together:**
   ```bash
   npm run dev
   ```
   This starts the backend on `http://localhost:4000` and the frontend on
   `http://localhost:5173` (Vite proxies `/api/*` to the backend, so the app
   works the same way it will in production).

## Deploying to Vercel

The app is structured to deploy as a single Vercel project — static frontend
+ one serverless function for the whole API.

1. Push this project to a Git repo and import it in Vercel (or run
   `vercel` from the project root).
2. Vercel will pick up `vercel.json` automatically:
   - `buildCommand: npm run build` → installs workspace deps and builds the
     frontend (`frontend/dist`).
   - `outputDirectory: frontend/dist` → served as static assets.
   - Everything under `api/` is deployed as serverless functions
     automatically (`api/[...path].js` catches all `/api/*` routes).
3. In the Vercel project's **Settings → Environment Variables**, add:
   - `MONGODB_URI` — your Atlas connection string.
   - `JWT_SECRET` — a long random string (use a different one than local dev).
   - `NODE_ENV=production` (enables the `secure` flag on the auth cookie).
4. Deploy. On first request, the serverless function connects to MongoDB and
   reuses that connection across warm invocations.

### MongoDB Atlas + restrictive networks

If `mongodb+srv://` connection strings fail to resolve (some sandboxed/VPN
networks block the DNS SRV lookup Node needs), use the non-SRV form instead:
look up the three shard hostnames and the `replicaSet` name via
`nslookup -type=SRV _mongodb._tcp.<cluster>.mongodb.net` and
`nslookup -type=TXT <cluster>.mongodb.net`, then build a standard
`mongodb://host1:27017,host2:27017,host3:27017/...?replicaSet=...` URI. This
isn't Vercel-specific — it only matters for whatever machine is running the
Node process (local dev machine, CI, etc).
