import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './db.js';
import { syncIndexes } from './syncIndexes.js';

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => syncIndexes())
  .then(() => {
    app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
