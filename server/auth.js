import jwt from 'jsonwebtoken';
import { findUserByEmail } from './db.js';

function secret() {
  return process.env.JWT_SECRET;
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, secret(), { expiresIn: '7d' });
}

// Middleware: only lets logged-in requests through and attaches req.user
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Please log in first.' });
  }
  try {
    const payload = jwt.verify(token, secret());
    const user = await findUserByEmail(payload.email);
    if (!user) {
      return res.status(401).json({ error: 'Please log in again.' });
    }
    req.user = { id: user.id, name: user.name, email: user.email };
    next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
}
