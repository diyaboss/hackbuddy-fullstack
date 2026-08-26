import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import sqlite3Store from 'better-sqlite3-session-store';
import { db } from './db/index.js';
import { config } from './config/index.js';

import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import discoverRoutes from './routes/discover.js';
import requestRoutes from './routes/requests.js';
import matchRoutes from './routes/matches.js';
import adminRoutes from './routes/admin.js';
import problemStatementRoutes from './routes/problem-statements.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: config.frontendOrigins,
  credentials: true,
}));

// Body parser
app.use(express.json());

// Session setup
const SqliteStore = sqlite3Store(session);
app.use(session({
  store: new SqliteStore({
    client: db,
    expired: {
      clear: true,
      intervalMs: 900000 //ms = 15min
    }
  }),
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'none' : 'lax'
  }
}));

// Basic route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/team-requests', requestRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/problem-statements', problemStatementRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: config.nodeEnv === 'production' ? 'Internal server error' : err.message
  });
});

app.listen(config.port, () => {
  console.log(`HackBuddy backend running on http://localhost:${config.port}`);
});
