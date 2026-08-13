import { Router } from 'express';
import ImportantTask from '../models/ImportantTask.js';

const router = Router();

// GET /api/important-tasks -> [{ _id, name, done, order }]
router.get('/', async (req, res) => {
  const tasks = await ImportantTask.find({ userId: req.userId }).sort({ order: 1, createdAt: 1 });
  res.json(tasks);
});

// POST /api/important-tasks  { name }
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  const count = await ImportantTask.countDocuments({ userId: req.userId });
  const task = await ImportantTask.create({ userId: req.userId, name: name.trim(), order: count });
  res.status(201).json(task);
});

// PATCH /api/important-tasks/:id  { name?, done? }
router.patch('/:id', async (req, res) => {
  const { name, done } = req.body;
  const update = {};
  if (name !== undefined) update.name = name.trim();
  if (done !== undefined) update.done = done;

  const task = await ImportantTask.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, update, { new: true });
  if (!task) return res.status(404).json({ error: 'not found' });
  res.json(task);
});

// DELETE /api/important-tasks/:id
router.delete('/:id', async (req, res) => {
  await ImportantTask.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  res.status(204).end();
});

export default router;
