# Study Task Progress — Planner

A weekly study planner (calendar, time-slot grid, important tasks, progress
stats) built with React + Express + MongoDB. Each user has their own account
and their own private set of tasks.

## Project structure

```
frontend/    React app (Vite)
backend/     Express API + Mongoose models, run via `server.js`
vercel.json  Vercel Services config (two services + rewrites)
```

In production (Vercel), `vercel.json` declares this as a **Vercel Services**
project (a monorepo-native feature — see
[vercel.com/docs/services](https://vercel.com/docs/services)) with two
services: `frontend` (built as a static Vite app) and `backend` (Express,
entrypoint `server.js`). A rewrite sends `/api/*` to the backend service,
everything else to the frontend. Despite `backend` running an
`app.listen()`-based Express server, Vercel Services still run on Vercel's
serverless Functions runtime (Fluid compute) under the hood — it scales to
zero like any other Vercel Function, it's just configured per-service instead
of via a hand-written `api/` catch-all handler.

Locally, `npm run dev` runs the same two pieces side by side (Vite dev server
+ `node server.js`), with Vite's dev proxy standing in for the `/api/*`
rewrite rule.

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

This repo is set up as a single Vercel project with two Services (see above).
The **dashboard's** "Import Project" wizard doesn't have a clean way to link
a repo at its true root when it detects multiple workspace packages — it
keeps prompting you to pick `frontend` or `backend` as a standalone project
root, which breaks the app (each half can't see the other). Use the
**Vercel CLI** from the repo root instead, which links correctly:

```bash
npx vercel login          # opens a browser to authenticate
npx vercel link --yes --project task-planner   # links this directory as one project
npx vercel env add MONGODB_URI production
npx vercel env add JWT_SECRET production        # use a different secret than local dev
npx vercel env add NODE_ENV production           # value: production
npx vercel deploy --prod --yes
```

Once linked, future deploys are just `npx vercel deploy --prod --yes` (or
push to the connected GitHub branch, since `vercel link` also wires up
GitHub auto-deploys).

### MongoDB Atlas + restrictive networks

If `mongodb+srv://` connection strings fail to resolve (some sandboxed/VPN
networks block the DNS SRV lookup Node needs), use the non-SRV form instead:
look up the three shard hostnames and the `replicaSet` name via
`nslookup -type=SRV _mongodb._tcp.<cluster>.mongodb.net` and
`nslookup -type=TXT <cluster>.mongodb.net`, then build a standard
`mongodb://host1:27017,host2:27017,host3:27017/...?replicaSet=...` URI. This
isn't Vercel-specific — it only matters for whatever machine is running the
Node process (local dev machine, CI, etc).
