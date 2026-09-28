import crypto from 'node:crypto';

// ---------------------------------------------------------------------------
// OTP store — in-memory (fine for a single-instance MVP).
// Rules: 6-digit code, expires in 5 min, max 5 wrong attempts,
// max 3 sends per number per 15 minutes.
// NOTE: never store plaintext OTPs longer than the expiry — codes are
// deleted immediately after a successful verify or on expiry.
// ---------------------------------------------------------------------------
const codes = new Map(); // phone -> { code, expiresAt, attempts }
const sendLog = new Map(); // phone -> [timestamps]

export function normalizePhone(input) {
  let p = String(input || '').replace(/\D/g, '');
  if (p.startsWith('0091')) p = p.slice(4);
  if (p.startsWith('91') && p.length === 12) p = p.slice(2);
  if (p.length === 10 && /^[6-9]/.test(p)) return '+91' + p;
  if (p.length === 12 && p.startsWith('91')) return '+' + p;
  return null;
}

export function sendOtp(phone) {
  const p = normalizePhone(phone);
  if (!p) return { error: 'Please enter a valid 10-digit Indian mobile number.' };
  const now = Date.now();
  const log = (sendLog.get(p) || []).filter((t) => now - t < 15 * 60 * 1000);
  if (log.length >= 3) {
    return { error: 'Too many OTP requests for this number. Please try again in 15 minutes.' };
  }
  log.push(now);
  sendLog.set(p, log);
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  codes.set(p, { code, expiresAt: now + 5 * 60 * 1000, attempts: 0 });
  return { ok: true, phone: p, code };
}

export function verifyOtp(phone, otp) {
  const p = normalizePhone(phone);
  if (!p) return { error: 'Please enter a valid mobile number.' };
  const rec = codes.get(p);
  if (!rec) return { error: 'No OTP found for this number. Please request a new OTP.' };
  if (Date.now() > rec.expiresAt) {
    codes.delete(p);
    return { error: 'OTP has expired. Please request a new OTP.' };
  }
  if (rec.attempts >= 5) {
    codes.delete(p);
    return { error: 'Too many incorrect attempts. Please request a new OTP.' };
  }
  if (rec.code !== String(otp || '').trim()) {
    rec.attempts++;
    return { error: 'Incorrect OTP. Please try again.' };
  }
  codes.delete(p);
  return { ok: true, phone: p };
}
