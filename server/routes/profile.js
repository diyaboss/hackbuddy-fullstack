import express from 'express';
import { db } from '../db/index.js';
import { requireAuth, requirePhoneVerified } from '../middleware/auth.js';

const router = express.Router();

// Get own profile
router.get('/me', requireAuth, (req, res) => {
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.user.id);
  if (!profile) {
    return res.json({ exists: false });
  }

  const skills = db.prepare('SELECT skill FROM profile_skills WHERE user_id = ?').all(req.user.id).map(r => r.skill);
  const lookingFor = db.prepare('SELECT skill FROM profile_looking_for WHERE user_id = ?').all(req.user.id).map(r => r.skill);

  res.json({
    exists: true,
    ...profile,
    skills,
    lookingFor
  });
});

// Create or update profile
router.put('/me', requireAuth, requirePhoneVerified, (req, res) => {
  const { name, branch, year, gender, team_size, bio, avatar, working_style, skills, lookingFor } = req.body;

  if (!name || !branch || !year || !gender || team_size === undefined || !skills || !lookingFor) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const upsertProfile = db.prepare(`
    INSERT INTO profiles (user_id, name, branch, year, gender, team_size, bio, avatar, working_style, profile_complete)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    ON CONFLICT(user_id) DO UPDATE SET
      name=excluded.name,
      branch=excluded.branch,
      year=excluded.year,
      gender=excluded.gender,
      team_size=excluded.team_size,
      bio=excluded.bio,
      avatar=excluded.avatar,
      working_style=excluded.working_style,
      profile_complete=1,
      updated_at=CURRENT_TIMESTAMP
  `);

  db.transaction(() => {
    upsertProfile.run(req.user.id, name, branch, year, gender, team_size, bio || '', avatar || '', working_style || '');

    // Update skills
    db.prepare('DELETE FROM profile_skills WHERE user_id = ?').run(req.user.id);
    const insertSkill = db.prepare('INSERT INTO profile_skills (user_id, skill) VALUES (?, ?)');
    for (const skill of skills) {
      insertSkill.run(req.user.id, skill);
    }

    // Update looking for
    db.prepare('DELETE FROM profile_looking_for WHERE user_id = ?').run(req.user.id);
    const insertLooking = db.prepare('INSERT INTO profile_looking_for (user_id, skill) VALUES (?, ?)');
    for (const skill of lookingFor) {
      insertLooking.run(req.user.id, skill);
    }
  })();

  res.json({ success: true });
});

// Update matching status
router.patch('/matching-status', requireAuth, (req, res) => {
  const { status } = req.body;
  if (!['active', 'paused', 'team_found'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.prepare('UPDATE profiles SET matching_status = ? WHERE user_id = ?').run(status, req.user.id);
  
  if (status === 'team_found') {
    // Cancel pending requests
    db.prepare('UPDATE team_requests SET status = "cancelled" WHERE (sender_id = ? OR receiver_id = ?) AND status = "pending"').run(req.user.id, req.user.id);
  }

  res.json({ success: true });
});

export default router;
