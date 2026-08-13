import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.js';
import tasksRouter from './routes/tasks.js';
import completionsRouter from './routes/completions.js';
import importantTasksRouter from './routes/importantTasks.js';
import requireAuth from './middleware/requireAuth.js';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/tasks', requireAuth, tasksRouter);
app.use('/api/completions', requireAuth, completionsRouter);
app.use('/api/important-tasks', requireAuth, importantTasksRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;
