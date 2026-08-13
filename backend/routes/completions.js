import { Router } from 'express';
import Completion from '../models/Completion.js';

const router = Router();

// GET /api/completions -> { "2026-08-13|09": true, ... }
router.get('/', async (req, res) => {
  const completions = await Completion.find({ userId: req.userId });
  const map = {};
  for (const c of completions) {
    map[`${c.date}|${String(c.hour).padStart(2, '0')}`] = true;
  }
  res.json(map);
});

// PUT /api/completions/:date/:hour  { completed }
router.put('/:date/:hour', async (req, res) => {
  const { date, hour } = req.params;
  const { completed } = req.body;

  if (completed) {
    await Completion.findOneAndUpdate(
      { userId: req.userId, date, hour: Number(hour) },
      { userId: req.userId, date, hour: Number(hour) },
      { upsert: true }
    );
  } else {
    await Completion.deleteOne({ userId: req.userId, date, hour: Number(hour) });
  }
  res.status(204).end();
});

export default router;
