import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendOrigins: (process.env.FRONTEND_ORIGINS || 'http://localhost:5173').split(','),
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  emailAccessMode: process.env.EMAIL_ACCESS_MODE || 'all', // 'all' or 'domain'
  allowedEmailDomain: process.env.ALLOWED_EMAIL_DOMAIN || 'vitstudent.ac.in',
  adminConfigPath: process.env.ADMIN_CONFIG_PATH || '.private/admins.json',
  sessionSecret: process.env.SESSION_SECRET || 'fallback_secret',
};
