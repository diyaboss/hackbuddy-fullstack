import express from 'express';
import { db } from '../db/index.js';
import { requireAdmin, requireSuperAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAdmin);

router.get('/overview', (req, res) => {
  const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'user'").get().count;
  const activeMatching = db.prepare("SELECT COUNT(*) as count FROM profiles JOIN users ON profiles.user_id = users.id WHERE matching_status = 'active' AND role = 'user'").get().count;
  const teamFound = db.prepare("SELECT COUNT(*) as count FROM profiles JOIN users ON profiles.user_id = users.id WHERE matching_status = 'team_found' AND role = 'user'").get().count;
  const paused = db.prepare("SELECT COUNT(*) as count FROM profiles JOIN users ON profiles.user_id = users.id WHERE matching_status = 'paused' AND role = 'user'").get().count;
  
  const pendingRequests = db.prepare("SELECT COUNT(*) as count FROM team_requests WHERE status = 'pending'").get().count;
  const matchesCount = db.prepare("SELECT COUNT(*) as count FROM matches").get().count;

  res.json({
    totalUsers,
    activeMatching,
    teamFound,
    paused,
    pendingRequests,
    matchesCount
  });
});

router.get('/users', (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.email, u.created_at, p.name, p.branch, p.year, p.gender, p.team_size, p.matching_status
    FROM users u
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE u.role = 'user'
    ORDER BY u.created_at DESC
  `).all();
  
  const enriched = users.map(u => {
    let skills = [];
    let lookingFor = [];
    if (u.name) { // means profile exists
      skills = db.prepare('SELECT skill FROM profile_skills WHERE user_id = ?').all(u.id).map(s => s.skill);
      lookingFor = db.prepare('SELECT skill FROM profile_looking_for WHERE user_id = ?').all(u.id).map(s => s.skill);
    }
    return {
      ...u,
      skills,
      lookingFor
    };
  });

  res.json(enriched);
});

router.get('/matching-users', (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.email, u.created_at, p.name, p.branch, p.year, p.gender, p.team_size, p.matching_status
    FROM users u
    JOIN profiles p ON u.id = p.user_id
    WHERE u.role = 'user' AND p.matching_status = 'active'
    ORDER BY u.created_at DESC
  `).all();
  
  const enriched = users.map(u => {
    let skills = db.prepare('SELECT skill FROM profile_skills WHERE user_id = ?').all(u.id).map(s => s.skill);
    let lookingFor = db.prepare('SELECT skill FROM profile_looking_for WHERE user_id = ?').all(u.id).map(s => s.skill);
    return {
      ...u,
      skills,
      lookingFor
    };
  });

  res.json(enriched);
});

router.delete('/users/:id', requireSuperAdmin, (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  if (targetId === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }

  const targetUser = db.prepare('SELECT role FROM users WHERE id = ?').get(targetId);
  if (!targetUser) return res.status(404).json({ error: 'User not found' });
  
  if (targetUser.role === 'superadmin' || targetUser.role === 'admin') {
    return res.status(403).json({ error: 'Cannot delete admin users via this endpoint' });
  }

  // Relying on CASCADE in schema, we just delete the user
  db.prepare('DELETE FROM users WHERE id = ?').run(targetId);

  res.json({ success: true });
});

export default router;
