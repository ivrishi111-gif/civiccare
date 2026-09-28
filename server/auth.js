import jwt from 'jsonwebtoken';
import { findUserById, findAuthorityById } from './db.js';

function secret() {
  return process.env.JWT_SECRET;
}

// role: 'user' (citizen) | 'authority' (municipal staff)
export function signToken(user, role) {
  return jwt.sign(
    { sub: user.id, email: user.email || null, phone: user.phone || null, role },
    secret(),
    { expiresIn: '7d' }
  );
}

// Middleware: citizen (role = user)
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in first.' });
  try {
    const payload = jwt.verify(token, secret());
    if (payload.role !== 'user') {
      return res.status(403).json({ error: 'Citizen account required.' });
    }
    const user = await findUserById(payload.sub);
    if (!user) return res.status(401).json({ error: 'Please log in again.' });
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email || null,
      phone: user.phone || null,
      language: user.language || 'en',
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
}

// Middleware: authority portal only (role = authority). Normal users can NEVER pass this.
export async function requireAuthority(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authority login required.' });
  try {
    const payload = jwt.verify(token, secret());
    if (payload.role !== 'authority') {
      return res.status(403).json({ error: 'You do not have authority access.' });
    }
    const authority = await findAuthorityById(payload.sub);
    if (!authority) return res.status(401).json({ error: 'Please log in again.' });
    req.authority = {
      id: authority.id,
      name: authority.name,
      phone: authority.phone,
      department: authority.department,
      area: authority.area,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }
}
