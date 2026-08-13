import { Router } from 'express';
import Task from '../models/Task.js';

const router = Router();

// GET /api/tasks -> { "1": { "5": "Wash up", ... }, "2026-08-13": { "9": "..." } }
router.get('/', async (req, res) => {
  const tasks = await Task.find({ userId: req.userId });
  const grouped = {};
  for (const t of tasks) {
    if (!grouped[t.key]) grouped[t.key] = {};
    grouped[t.key][t.hour] = t.name;
  }
  res.json(grouped);
});

// PUT /api/tasks/:key/:hour  { name }
router.put('/:key/:hour', async (req, res) => {
  const { key, hour } = req.params;
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  const task = await Task.findOneAndUpdate(
    { userId: req.userId, key, hour: Number(hour) },
    { userId: req.userId, key, hour: Number(hour), name: name.trim() },
    { upsert: true, new: true }
  );
  res.json(task);
});

// DELETE /api/tasks/:key/:hour
router.delete('/:key/:hour', async (req, res) => {
  const { key, hour } = req.params;
  await Task.deleteOne({ userId: req.userId, key, hour: Number(hour) });
  res.status(204).end();
});

// POST /api/tasks/ensure-date/:date  { dow }
// If no per-date tasks exist yet for :date, clone the weekday template (key=dow)
// into per-date docs so editing one date doesn't affect the whole weekday template.
// Returns the resulting { hour: name } map for the date either way.
router.post('/ensure-date/:date', async (req, res) => {
  const { date } = req.params;
  const { dow } = req.body;

  const alreadyHasOverride = await Task.exists({ userId: req.userId, key: date });
  if (!alreadyHasOverride && dow) {
    const templateTasks = await Task.find({ userId: req.userId, key: String(dow) });
    if (templateTasks.length) {
      const docs = templateTasks.map((t) => ({ userId: req.userId, key: date, hour: t.hour, name: t.name }));
      try {
        await Task.insertMany(docs, { ordered: false });
      } catch {
        // ignore races where docs were created concurrently
      }
    }
  }

  const tasksForDate = await Task.find({ userId: req.userId, key: date });
  const result = {};
  for (const t of tasksForDate) result[t.hour] = t.name;
  res.json(result);
});

export default router;
