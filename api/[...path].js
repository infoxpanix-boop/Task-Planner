import app from '../backend/app.js';
import { connectDB } from '../backend/db.js';
import { syncIndexes } from '../backend/syncIndexes.js';

// Module scope persists across warm invocations of the same serverless
// instance, so this only re-runs on a cold start.
let ready = null;

async function ensureReady() {
  if (!ready) {
    ready = connectDB().then(() => syncIndexes());
  }
  await ready;
}

export default async function handler(req, res) {
  await ensureReady();
  return app(req, res);
}
