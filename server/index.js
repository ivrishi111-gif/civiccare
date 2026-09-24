import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

import {
  isDemoMode,
  seedDemo,
  findUserByEmail,
  createUser,
  getComplaints,
  getComplaint,
  createComplaint,
  updateComplaint,
  deleteComplaint,
} from './db.js';
import { signToken, requireAuth } from './auth.js';
import { analyzeImage, improveText, aiEnabled } from './ai.js';
import { CATEGORIES, STATUSES } from './constants.js';

// ---------------------------------------------------------------------------
// Secrets & config
// ---------------------------------------------------------------------------
if (!process.env.JWT_SECRET) {
  if (isDemoMode) {
    process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
    console.log('[auth] No JWT_SECRET set — using a random one (login tokens reset on restart).');
  } else {
    console.error('[auth] Please set JWT_SECRET in server/.env (a long random string).');
    process.exit(1);
  }
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '8mb' }));

// CORS: open for local dev, locked to CLIENT_URL (+ localhost) in production
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173']
  : true;
app.use(cors({ origin: allowedOrigins }));

// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

// ---------------------------------------------------------------------------
// Rate limiting (anti-spam / anti-brute-force)
// ---------------------------------------------------------------------------
const apiLimiter = rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many requests. Please slow down a bit.' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many attempts. Please try again in a few minutes.' } });
const aiLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many AI requests. Please try again later.' } });
app.use('/api', apiLimiter);

// Friendly error — raw errors never reach the user
const friendly = (res) => res.status(500).json({ error: 'Something went wrong. Please try again.' });

// ---------------------------------------------------------------------------
// Health check (used by Render + the frontend demo banner)
// ---------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: 'civiccare-api', demoMode: isDemoMode, aiEnabled });
});

// ---------------------------------------------------------------------------
// Auth (email + password, bcrypt hashing, JWT sessions)
// ---------------------------------------------------------------------------
app.post('/api/auth/signup', authLimiter, async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are all required.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    if (await findUserByEmail(email)) return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
    const password_hash = await bcrypt.hash(password, 10);
    const user = await createUser({ name, email, password_hash });
    res.json({ token: signToken(user), user: { id: user.id, name: user.name, email: user.email } });
  } catch (e) {
    console.error('signup error:', e.message);
    if (/duplicate/i.test(e.message || '')) return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
    return friendly(res);
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    const user = await findUserByEmail(email);
    if (!user) return res.status(401).json({ error: 'No account found with this email. Please sign up first.' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    res.json({ token: signToken(user), user: { id: user.id, name: user.name, email: user.email } });
  } catch (e) {
    console.error('login error:', e.message);
    return friendly(res);
  }
});

app.get('/api/me', requireAuth, (req, res) => res.json({ user: req.user }));

// ---------------------------------------------------------------------------
// Complaints (users can only ever see/edit their own — enforced in db.js)
// ---------------------------------------------------------------------------
function validateComplaint(body) {
  const title = String(body?.title || '').trim().slice(0, 120);
  const category = CATEGORIES.includes(body?.category) ? body.category : 'Other';
  const description = String(body?.description || '').trim().slice(0, 1000);
  const location = String(body?.location || '').trim().slice(0, 200);
  const status = STATUSES.includes(body?.status) ? body.status : 'open';
  let photo = null;
  if (typeof body?.photo === 'string' && body.photo.startsWith('data:image/')) {
    if (body.photo.length > 5_000_000) return { error: 'Image is too large. Please use a photo under 4 MB.' };
    photo = body.photo;
  }
  if (!title) return { error: 'Please add a short title for the problem.' };
  if (!description) return { error: 'Please add a short description of the problem.' };
  return { value: { title, category, description, location, status, photo } };
}

app.get('/api/complaints', requireAuth, async (req, res) => {
  try {
    res.json({ complaints: await getComplaints(req.user.id) });
  } catch (e) {
    console.error(e);
    return friendly(res);
  }
});

app.post('/api/complaints', requireAuth, async (req, res) => {
  try {
    const v = validateComplaint(req.body);
    if (v.error) return res.status(400).json({ error: v.error });
    const complaint = await createComplaint(req.user.id, v.value);
    res.status(201).json({ complaint });
  } catch (e) {
    console.error(e);
    return friendly(res);
  }
});

app.get('/api/complaints/:id', requireAuth, async (req, res) => {
  try {
    const complaint = await getComplaint(req.params.id, req.user.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });
    res.json({ complaint });
  } catch (e) {
    console.error(e);
    return friendly(res);
  }
});

app.put('/api/complaints/:id', requireAuth, async (req, res) => {
  try {
    const existing = await getComplaint(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'Complaint not found.' });
    const v = validateComplaint({ ...existing, ...req.body });
    if (v.error) return res.status(400).json({ error: v.error });
    const complaint = await updateComplaint(req.params.id, req.user.id, v.value);
    res.json({ complaint });
  } catch (e) {
    console.error(e);
    return friendly(res);
  }
});

app.delete('/api/complaints/:id', requireAuth, async (req, res) => {
  try {
    const ok = await deleteComplaint(req.params.id, req.user.id);
    if (!ok) return res.status(404).json({ error: 'Complaint not found.' });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return friendly(res);
  }
});

// ---------------------------------------------------------------------------
// AI (Gemini — backend only, mock fallback in demo mode)
// ---------------------------------------------------------------------------
app.post('/api/ai/analyze', requireAuth, aiLimiter, async (req, res) => {
  try {
    const { image, text } = req.body || {};
    if (!image && !String(text || '').trim()) {
      return res.status(400).json({ error: 'Add a photo or a short note first.' });
    }
    res.json(await analyzeImage({ image, text }));
  } catch (e) {
    console.error('ai analyze error:', e.message);
    return res.status(502).json({ error: 'AI analysis failed. Please fill in the details manually.' });
  }
});

app.post('/api/ai/improve', requireAuth, aiLimiter, async (req, res) => {
  try {
    const text = String(req.body?.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Write a short note first.' });
    res.json(await improveText({ text }));
  } catch (e) {
    console.error('ai improve error:', e.message);
    return res.status(502).json({ error: 'AI could not improve the note. Please try again.' });
  }
});

// 404 + error fallback
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));
app.use((err, req, res, next) => {
  console.error(err);
  return friendly(res);
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
await seedDemo();
const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`CIVICCARE API ready → http://localhost:${PORT}`);
  console.log(`  demo mode: ${isDemoMode} | AI: ${aiEnabled ? 'Gemini connected' : 'mock (set GEMINI_API_KEY)'}`);
});
