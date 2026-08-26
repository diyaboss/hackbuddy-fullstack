import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import { db } from '../db/index.js';
import { config } from '../config/index.js';
import { syncAdminRole, requireAuth } from '../middleware/auth.js';

import { parsePhoneNumberWithError } from 'libphonenumber-js';

const router = express.Router();
const client = new OAuth2Client(config.googleClientId);

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Missing credential' });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: config.googleClientId,
    });
    const payload = ticket.getPayload();

    if (!payload.email_verified) {
      return res.status(403).json({ error: 'Email not verified by Google' });
    }

    const email = payload.email.toLowerCase();

    // Check email policy
    if (config.emailAccessMode === 'domain') {
      const domain = email.split('@')[1];
      if (domain !== config.allowedEmailDomain) {
        return res.status(403).json({ error: 'Email domain not allowed' });
      }
    }

    const googleSub = payload.sub;
    const role = syncAdminRole(email);

    // Find or create user
    let user = db.prepare('SELECT * FROM users WHERE google_sub = ?').get(googleSub);
    if (!user) {
      const insertUser = db.prepare(`
        INSERT INTO users (google_sub, email, email_verified, role) 
        VALUES (?, ?, 1, ?)
      `);
      const info = insertUser.run(googleSub, email, role);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    } else {
      // Update role in case config changed
      if (user.role !== role) {
        db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, user.id);
        user.role = role;
      }
    }

    // Set session
    req.session.userId = user.id;

    // Fetch profile status
    const profile = db.prepare('SELECT profile_complete FROM profiles WHERE user_id = ?').get(user.id);
    const profileComplete = profile ? profile.profile_complete === 1 : false;

    res.json({
      user: {
        id: user.id,
        email: user.email,
        phone_verified: user.phone_verified === 1,
        role: user.role,
        profile_complete: profileComplete
      }
    });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

router.post('/phone', requireAuth, async (req, res) => {
  try {
    const { phoneNumber, country } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: 'Phone number required' });

    let normalizedPhone;
    try {
      const pn = parsePhoneNumberWithError(phoneNumber, country || 'IN');
      if (!pn.isValid()) {
        throw new Error('Invalid number');
      }
      normalizedPhone = pn.format('E.164');
    } catch (err) {
      return res.status(400).json({ error: 'Invalid phone number for the selected country' });
    }

    // Ensure phone number isn't already used by someone else
    const existing = db.prepare('SELECT id FROM users WHERE phone_number = ? AND id != ?').get(normalizedPhone, req.user.id);
    if (existing) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    db.prepare('UPDATE users SET phone_number = ?, phone_verified = 1 WHERE id = ?').run(normalizedPhone, req.user.id);
    
    res.json({ success: true, normalizedPhone });
  } catch (error) {
    console.error('Phone update error:', error);
    res.status(500).json({ error: 'Failed to update phone number' });
  }
});

router.get('/me', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = db.prepare('SELECT id, email, phone_number, phone_verified, role FROM users WHERE id = ?').get(req.session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  const profile = db.prepare('SELECT profile_complete, matching_status FROM profiles WHERE user_id = ?').get(user.id);
  
  res.json({
    user: {
      id: user.id,
      email: user.email,
      hasPhoneNumber: !!user.phone_number,
      role: user.role,
      profile_complete: profile ? profile.profile_complete === 1 : false,
      matching_status: profile ? profile.matching_status : null
    }
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

export default router;
