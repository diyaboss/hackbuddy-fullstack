import express from 'express';
import { db } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Middleware to ensure user is part of the match
const requireMatchMembership = (req, res, next) => {
  const matchId = req.params.matchId;
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  
  if (match.user_a_id !== req.user.id && match.user_b_id !== req.user.id) {
    return res.status(403).json({ error: 'Not part of this match' });
  }
  
  req.match = match;
  next();
};

router.get('/', requireAuth, (req, res) => {
  const matches = db.prepare(`
    SELECT m.id as match_id, p.* 
    FROM matches m
    JOIN profiles p ON (p.user_id = m.user_a_id OR p.user_id = m.user_b_id)
    WHERE (m.user_a_id = ? OR m.user_b_id = ?) AND p.user_id != ?
  `).all(req.user.id, req.user.id, req.user.id);

  const enriched = matches.map(m => {
    const skills = db.prepare('SELECT skill FROM profile_skills WHERE user_id = ?').all(m.user_id).map(s => s.skill);
    return {
      matchId: m.match_id,
      teammate: {
        id: m.user_id,
        name: m.name,
        avatar: m.avatar,
        skills
      }
    };
  });

  res.json(enriched);
});

router.get('/:matchId/room', requireAuth, requireMatchMembership, (req, res) => {
  const otherUserId = req.match.user_a_id === req.user.id ? req.match.user_b_id : req.match.user_a_id;
  
  const teammateProfile = db.prepare('SELECT name, avatar, bio, branch, year FROM profiles WHERE user_id = ?').get(otherUserId);
  const skills = db.prepare('SELECT skill FROM profile_skills WHERE user_id = ?').all(otherUserId).map(s => s.skill);
  const lookingFor = db.prepare('SELECT skill FROM profile_looking_for WHERE user_id = ?').all(otherUserId).map(s => s.skill);
  
  teammateProfile.skills = skills;
  teammateProfile.lookingFor = lookingFor;

  // Selections
  const yourSelections = db.prepare('SELECT problem_statement_id FROM match_problem_statement_selections WHERE match_id = ? AND user_id = ?')
    .all(req.match.id, req.user.id).map(r => r.problem_statement_id);
    
  const theirSelections = db.prepare('SELECT problem_statement_id FROM match_problem_statement_selections WHERE match_id = ? AND user_id = ?')
    .all(req.match.id, otherUserId).map(r => r.problem_statement_id);

  // Contacts
  const youShared = db.prepare('SELECT 1 FROM contact_shares WHERE match_id = ? AND sharing_user_id = ?').get(req.match.id, req.user.id);
  const theyShared = db.prepare('SELECT 1 FROM contact_shares WHERE match_id = ? AND sharing_user_id = ?').get(req.match.id, otherUserId);
  
  let theirContact = null;
  if (theyShared) {
    theirContact = db.prepare('SELECT phone_number FROM users WHERE id = ?').get(otherUserId).phone_number;
  }

  res.json({
    teammate: teammateProfile,
    selections: {
      yours: yourSelections,
      theirs: theirSelections
    },
    contact: {
      youShared: !!youShared,
      theyShared: !!theyShared,
      theirContact
    }
  });
});

router.put('/:matchId/problem-statements', requireAuth, requireMatchMembership, (req, res) => {
  const { statementIds } = req.body;
  
  db.transaction(() => {
    db.prepare('DELETE FROM match_problem_statement_selections WHERE match_id = ? AND user_id = ?').run(req.match.id, req.user.id);
    const insert = db.prepare('INSERT INTO match_problem_statement_selections (match_id, user_id, problem_statement_id) VALUES (?, ?, ?)');
    
    for (const id of statementIds) {
      insert.run(req.match.id, req.user.id, id);
    }
  })();
  
  res.json({ success: true });
});

router.post('/:matchId/share-contact', requireAuth, requireMatchMembership, (req, res) => {
  const otherUserId = req.match.user_a_id === req.user.id ? req.match.user_b_id : req.match.user_a_id;
  
  try {
    db.prepare('INSERT INTO contact_shares (match_id, sharing_user_id, recipient_user_id) VALUES (?, ?, ?)')
      .run(req.match.id, req.user.id, otherUserId);
  } catch (err) {
    // ignore duplicate
  }
  
  res.json({ success: true });
});

export default router;
