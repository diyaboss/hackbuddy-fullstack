import express from 'express';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const statements = db.prepare('SELECT id, code, title, description FROM problem_statements WHERE active = 1').all();
  res.json(statements);
});

export default router;
