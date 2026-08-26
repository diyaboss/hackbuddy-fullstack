import { db } from '../db/index.js';
import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';

export const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Optionally fetch user to attach to req
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  
  req.user = user;
  next();
};

export const requirePhoneVerified = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (!req.user.phone_verified) {
    return res.status(403).json({ error: 'Phone verification required' });
  }
  next();
};

export const requireProfileComplete = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.prepare('SELECT profile_complete FROM profiles WHERE user_id = ?').get(req.user.id);
  if (!profile || !profile.profile_complete) {
    return res.status(403).json({ error: 'Profile completion required' });
  }
  next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const role = syncAdminRole(req.user.email);
  if (role !== 'admin' && role !== 'superadmin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const role = syncAdminRole(req.user.email);
  if (role !== 'superadmin') {
    return res.status(403).json({ error: 'Superadmin access required' });
  }
  next();
};

// Utility to sync admin roles on login based on config file
export const syncAdminRole = (email) => {
  try {
    const adminConfigPath = path.resolve(process.cwd(), config.adminConfigPath);
    if (fs.existsSync(adminConfigPath)) {
      const adminData = JSON.parse(fs.readFileSync(adminConfigPath, 'utf8'));
      const admin = adminData.admins.find(a => a.email.toLowerCase() === email.toLowerCase());
      if (admin) {
        return admin.role;
      }
    }
  } catch (err) {
    console.error('Failed to sync admin role:', err);
  }
  return 'user';
};
