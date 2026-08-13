# Study Task Progress — Planner

A weekly study planner (calendar, time-slot grid, important tasks, progress
stats) built with React + Express + MongoDB. Each user has their own account
and their own private set of tasks.

## Project structure

```
frontend/    React app (Vite)
backend/     Express API + Mongoose models, run via `server.js`
vercel.json  Vercel multi-service config
```

In production (Vercel), `vercel.json` declares two services — `frontend`
(built as a static Vite app) and `backend` (run as a persistent Express
service) — and rewrites `/api/*` requests to the backend service, everything
else to the frontend. Locally, `npm run dev` runs the same two pieces side by
side (Vite dev server + `node server.js`), with Vite's dev proxy standing in
for the rewrite rule.

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

The app deploys as a single Vercel project with two services, declared in
`vercel.json`:

- **frontend** (`root: frontend`, Vite) — built as a static site.
- **backend** (`root: backend`) — run as a persistent Express service.
- Rewrites send `/api/*` to the backend service, everything else to the
  frontend service.

Steps:

1. Push this project to a Git repo and import it in Vercel. Vercel reads
   `vercel.json` and sets up both services automatically — no manual "root
   directory" configuration needed per service.
2. In the Vercel project's **Settings → Environment Variables**, add (scoped
   to the **backend** service, since only it reads them):
   - `MONGODB_URI` — your Atlas connection string.
   - `JWT_SECRET` — a long random string (use a different one than local dev).
   - `NODE_ENV=production` (enables the `secure` flag on the auth cookie).
3. Deploy. The backend service connects to MongoDB on startup and keeps that
   connection for the life of the running instance.

### MongoDB Atlas + restrictive networks

If `mongodb+srv://` connection strings fail to resolve (some sandboxed/VPN
networks block the DNS SRV lookup Node needs), use the non-SRV form instead:
look up the three shard hostnames and the `replicaSet` name via
`nslookup -type=SRV _mongodb._tcp.<cluster>.mongodb.net` and
`nslookup -type=TXT <cluster>.mongodb.net`, then build a standard
`mongodb://host1:27017,host2:27017,host3:27017/...?replicaSet=...` URI. This
isn't Vercel-specific — it only matters for whatever machine is running the
Node process (local dev machine, CI, etc).
