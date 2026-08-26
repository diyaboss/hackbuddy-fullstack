import express from 'express';
import { db } from '../db/index.js';
import { requireAuth, requireProfileComplete } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, requireProfileComplete, (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.user.id;

  if (senderId === receiverId) {
    return res.status(400).json({ error: 'Cannot request yourself' });
  }

  // Check if both are active
  const senderProfile = db.prepare('SELECT matching_status FROM profiles WHERE user_id = ?').get(senderId);
  const receiverProfile = db.prepare('SELECT matching_status FROM profiles WHERE user_id = ?').get(receiverId);

  if (!senderProfile || senderProfile.matching_status !== 'active' || 
      !receiverProfile || receiverProfile.matching_status !== 'active') {
    return res.status(400).json({ error: 'Both users must be actively matching' });
  }

  // Check for existing request
  const existing = db.prepare('SELECT id, status FROM team_requests WHERE sender_id = ? AND receiver_id = ?').get(senderId, receiverId);
  
  if (existing) {
    if (existing.status === 'pending') return res.status(400).json({ error: 'Request already pending' });
    // If it was cancelled or declined, we might allow re-requesting in some business logics, but let's block for now to keep it simple
    return res.status(400).json({ error: `Request already ${existing.status}` });
  }
  
  // Check if they requested you
  const inverse = db.prepare('SELECT id, status FROM team_requests WHERE sender_id = ? AND receiver_id = ?').get(receiverId, senderId);
  if (inverse && inverse.status === 'pending') {
    // Auto-accept? Or just block and say "They already requested you"
    return res.status(400).json({ error: 'They already sent you a request. Check your requests!' });
  }

  db.prepare('INSERT INTO team_requests (sender_id, receiver_id) VALUES (?, ?)').run(senderId, receiverId);

  res.json({ success: true });
});

router.get('/incoming', requireAuth, (req, res) => {
  const requests = db.prepare(`
    SELECT r.id as request_id, p.* 
    FROM team_requests r
    JOIN profiles p ON r.sender_id = p.user_id
    WHERE r.receiver_id = ? AND r.status = 'pending'
  `).all(req.user.id);

  const enriched = requests.map(reqData => {
    const skills = db.prepare('SELECT skill FROM profile_skills WHERE user_id = ?').all(reqData.user_id).map(s => s.skill);
    const lookingFor = db.prepare('SELECT skill FROM profile_looking_for WHERE user_id = ?').all(reqData.user_id).map(s => s.skill);
    return {
      requestId: reqData.request_id,
      sender: {
        id: reqData.user_id,
        name: reqData.name,
        branch: reqData.branch,
        year: reqData.year,
        skills,
        lookingFor
      }
    };
  });

  res.json(enriched);
});

router.get('/outgoing', requireAuth, (req, res) => {
  const requests = db.prepare(`
    SELECT r.id as request_id, p.* 
    FROM team_requests r
    JOIN profiles p ON r.receiver_id = p.user_id
    WHERE r.sender_id = ? AND r.status = 'pending'
  `).all(req.user.id);

  const enriched = requests.map(reqData => {
    const skills = db.prepare('SELECT skill FROM profile_skills WHERE user_id = ?').all(reqData.user_id).map(s => s.skill);
    const lookingFor = db.prepare('SELECT skill FROM profile_looking_for WHERE user_id = ?').all(reqData.user_id).map(s => s.skill);
    return {
      requestId: reqData.request_id,
      receiver: {
        id: reqData.user_id,
        name: reqData.name,
        branch: reqData.branch,
        year: reqData.year,
        skills,
        lookingFor
      }
    };
  });

  res.json(enriched);
});

router.post('/:id/accept', requireAuth, (req, res) => {
  const requestId = req.params.id;
  
  const request = db.prepare('SELECT * FROM team_requests WHERE id = ? AND receiver_id = ?').get(requestId, req.user.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (request.status !== 'pending') return res.status(400).json({ error: 'Request is not pending' });

  db.transaction(() => {
    db.prepare('UPDATE team_requests SET status = "accepted", updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(requestId);
    
    // Create match
    db.prepare('INSERT INTO matches (user_a_id, user_b_id) VALUES (?, ?)')
      .run(Math.min(request.sender_id, request.receiver_id), Math.max(request.sender_id, request.receiver_id));
  })();

  res.json({ success: true });
});

router.post('/:id/decline', requireAuth, (req, res) => {
  const requestId = req.params.id;
  
  const request = db.prepare('SELECT * FROM team_requests WHERE id = ? AND receiver_id = ?').get(requestId, req.user.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (request.status !== 'pending') return res.status(400).json({ error: 'Request is not pending' });

  db.prepare('UPDATE team_requests SET status = "declined", updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(requestId);
  
  res.json({ success: true });
});

export default router;
