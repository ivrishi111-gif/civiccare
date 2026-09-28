import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

import {
  isDemoMode,
  seedIfEmpty,
  findUserById,
  findUserByEmail,
  findUserByPhone,
  createUser,
  findAuthorityByPhone,
  getComplaints,
  listAllComplaints,
  getComplaint,
  getComplaintAny,
  createComplaint,
  updateComplaint,
  updateComplaintByAuthority,
  deleteComplaint,
  listHistory,
  addHistory,
} from './db.js';
import { signToken, requireAuth, requireAuthority } from './auth.js';
import { analyzeImage, improveText, aiEnabled } from './ai.js';
import { sendOtp, verifyOtp, normalizePhone } from './otp.js';
import { sendSms } from './sms.js';
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

// CORS: open for local dev, locked to CLIENT_URL(s) in production.
// CLIENT_URL may contain several comma-separated URLs.
const extraOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((s) => s.trim()).filter(Boolean)
  : [];
const allowedOrigins = extraOrigins.length
  ? [...extraOrigins, 'http://localhost:5173', 'http://127.0.0.1:5173']
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
// Rate limiting
// ---------------------------------------------------------------------------
const apiLimiter = rateLimit({ windowMs: 60 * 1000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many requests. Please slow down a bit.' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many attempts. Please try again in a few minutes.' } });
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 6, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many OTP requests. Please try again in 15 minutes.' } });
const aiLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: 'Too many AI requests. Please try again later.' } });
app.use('/api', apiLimiter);

const friendly = (res) => res.status(500).json({ error: 'Something went wrong. Please try again.' });

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: 'civiccare-api', demoMode: isDemoMode, aiEnabled, smsProvider: process.env.SMS_PROVIDER || 'mock' });
});

// ---------------------------------------------------------------------------
// Auth — email + password (bcrypt) and mobile + OTP
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
    res.json({ token: signToken(user, 'user'), user: publicUser(user) });
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
    res.json({ token: signToken(user, 'user'), user: publicUser(user) });
  } catch (e) {
    console.error('login error:', e.message);
    return friendly(res);
  }
});

// ---- Mobile + OTP ----
app.post('/api/auth/otp/send', otpLimiter, async (req, res) => {
  try {
    const result = sendOtp(req.body?.phone);
    if (result.error) return res.status(400).json({ error: result.error });
    const message = `Your CIVICCARE OTP is ${result.code}. It expires in 5 minutes. Do not share it with anyone.`;
    const sms = await sendSms(result.phone, message);
    // demoOtp is ONLY returned when a real SMS provider is not configured
    res.json({
      ok: true,
      sentVia: sms.via,
      demoOtp: sms.via === 'mock' ? result.code : undefined,
    });
  } catch (e) {
    console.error('otp send error:', e.message);
    return friendly(res);
  }
});

app.post('/api/auth/otp/verify', authLimiter, async (req, res) => {
  try {
    const result = verifyOtp(req.body?.phone, req.body?.otp);
    if (result.error) return res.status(400).json({ error: result.error });

    let user = await findUserByPhone(result.phone);
    if (!user) {
      const last4 = result.phone.slice(-4);
      user = await createUser({
        name: `Citizen ${last4}`,
        phone: result.phone,
        email: null,
        password_hash: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10),
      });
    }
    res.json({ token: signToken(user, 'user'), user: publicUser(user), isNew: !req.body?.existing });
  } catch (e) {
    console.error('otp verify error:', e.message);
    return friendly(res);
  }
});

app.get('/api/me', requireAuth, (req, res) => res.json({ user: req.user }));

// ---------------------------------------------------------------------------
// Complaints (citizens — can only ever see their own)
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
  return { value: { title, category, description, location, status, photo, before_image: photo } };
}

app.get('/api/complaints', requireAuth, async (req, res) => {
  try {
    const complaints = await getComplaints(req.user.id);
    res.json({ complaints });
  } catch (e) {
    console.error(e);
    return friendly(res);
  }
});

app.post('/api/complaints', requireAuth, async (req, res) => {
  try {
    const v = validateComplaint(req.body);
    if (v.error) return res.status(400).json({ error: v.error });
    const complaint = await createComplaint(req.user.id, v.value, { actor: req.user.name });
    res.status(201).json({ complaint: { ...complaint, history: await listHistory(complaint.id) } });
  } catch (e) {
    console.error(e);
    return friendly(res);
  }
});

app.get('/api/complaints/:id', requireAuth, async (req, res) => {
  try {
    const complaint = await getComplaint(req.params.id, req.user.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });
    res.json({ complaint, history: await listHistory(complaint.id) });
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
    // citizens may not change status/evidence — those belong to the authority
    const { status, ...safe } = v.value;
    const complaint = await updateComplaint(req.params.id, req.user.id, safe);
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

// ---------------------------------------------------------------------------
// AUTHORITY PORTAL (separate auth, separate middleware — normal users can't pass)
// ---------------------------------------------------------------------------
app.post('/api/authority/login', authLimiter, async (req, res) => {
  try {
    const phone = normalizePhone(req.body?.phone);
    const password = String(req.body?.password || '');
    if (!phone || !password) return res.status(400).json({ error: 'Phone and password are required.' });
    const authority = await findAuthorityByPhone(phone);
    if (!authority) return res.status(401).json({ error: 'No authority account found for this number.' });
    const ok = await bcrypt.compare(password, authority.password_hash);
    if (!ok) return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    res.json({
      token: signToken(authority, 'authority'),
      authority: { id: authority.id, name: authority.name, phone: authority.phone, department: authority.department, area: authority.area, isDemo: !!authority.is_demo },
    });
  } catch (e) {
    console.error('authority login error:', e.message);
    return friendly(res);
  }
});

app.get('/api/authority/me', requireAuthority, (req, res) => res.json({ authority: req.authority }));

app.get('/api/authority/complaints', requireAuthority, async (req, res) => {
  try {
    const complaints = await listAllComplaints(req.query.status);
    res.json({ complaints });
  } catch (e) {
    console.error(e);
    return friendly(res);
  }
});

app.get('/api/authority/complaints/:id', requireAuthority, async (req, res) => {
  try {
    const complaint = await getComplaintAny(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });
    res.json({ complaint, history: await listHistory(complaint.id) });
  } catch (e) {
    console.error(e);
    return friendly(res);
  }
});

// status action: assign | start | resolve  (with optional note)
app.post('/api/authority/complaints/:id/action', requireAuthority, async (req, res) => {
  try {
    const { action, message } = req.body || {};
    const complaint = await getComplaintAny(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

    let status = null;
    let defaultMsg = '';
    if (action === 'assign') {
      status = 'assigned';
      defaultMsg = `Assigned to ${req.authority.name}.`;
    } else if (action === 'start') {
      status = 'in_progress';
      defaultMsg = 'Work started.';
    } else if (action === 'resolve') {
      status = 'resolved';
      defaultMsg = 'Work verified and complaint resolved.';
    } else {
      return res.status(400).json({ error: 'Unknown action.' });
    }

    const updated = await updateComplaintByAuthority(
      req.params.id,
      { status, authority_id: req.authority.id },
      req.authority.name,
      { status, message: String(message || defaultMsg).slice(0, 500), actor: req.authority.name, role: 'authority' }
    );
    res.json({ complaint: updated, history: await listHistory(updated.id) });
  } catch (e) {
    console.error(e);
    return friendly(res);
  }
});

// complete work — REQUIRES an after photo (official proof)
app.post('/api/authority/complaints/:id/complete', requireAuthority, async (req, res) => {
  try {
    const { afterImage, message } = req.body || {};
    if (typeof afterImage !== 'string' || !afterImage.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Please upload an AFTER photo — it is the official proof of completion.' });
    }
    if (afterImage.length > 5_000_000) return res.status(400).json({ error: 'Image is too large. Please use a photo under 4 MB.' });
    const complaint = await getComplaintAny(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });

    const updated = await updateComplaintByAuthority(
      req.params.id,
      { status: 'completed', after_image: afterImage, authority_id: req.authority.id },
      req.authority.name,
      {
        status: 'completed',
        message: String(message || 'Work completed. After photo uploaded as proof.').slice(0, 500),
        actor: req.authority.name,
        role: 'authority',
      }
    );
    res.json({ complaint: updated, history: await listHistory(updated.id) });
  } catch (e) {
    console.error(e);
    return friendly(res);
  }
});

// plain note/update without status change
app.post('/api/authority/complaints/:id/note', requireAuthority, async (req, res) => {
  try {
    const message = String(req.body?.message || '').trim().slice(0, 500);
    if (!message) return res.status(400).json({ error: 'Please write a short update note.' });
    const complaint = await getComplaintAny(req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });
    await addHistory(complaint.id, { status: complaint.status, message, actor: req.authority.name, role: 'authority' });
    res.json({ complaint, history: await listHistory(complaint.id) });
  } catch (e) {
    console.error(e);
    return friendly(res);
  }
});

// ---------------------------------------------------------------------------
// helpers & fallbacks
// ---------------------------------------------------------------------------
function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email || null, phone: u.phone || null, language: u.language || 'en' };
}

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));
app.use((err, req, res, next) => {
  console.error(err);
  return friendly(res);
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
await seedIfEmpty();
const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`CIVICCARE API ready → http://localhost:${PORT}`);
  console.log(`  demo mode: ${isDemoMode} | AI: ${aiEnabled ? 'Gemini connected' : 'mock'} | SMS: ${process.env.SMS_PROVIDER || 'mock'}`);
});
