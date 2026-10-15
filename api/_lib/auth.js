// api/_lib/auth.js — shared auth for the admin write endpoints.
//
// Not a route: Vercel ignores `_`-prefixed paths, and the `api/*.js` glob in vercel.json
// only matches direct children, so this file is bundled but never reachable over HTTP.
//
// The password lives in ADMIN_PASSWORD (a Vercel env var) and is never sent to the browser.
// /api/auth trades it for a short-lived HMAC-signed token; publish and revert accept only
// that token. Nothing secret ships in the client bundle.

const crypto = require('crypto');

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;   // 12h — long enough for an editing session
const MAX_ATTEMPTS   = 8;
const LOCKOUT_MS     = 10 * 60 * 1000;

// Signing key. Falls back to the password so a single env var is enough to get running;
// setting ADMIN_SESSION_SECRET separately means changing the password does not have to
// invalidate live sessions (and vice versa).
function secret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || '';
}

function sign(data) {
  return crypto.createHmac('sha256', secret()).update(data).digest('base64url');
}

function issueToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_TTL_MS })).toString('base64url');
  return payload + '.' + sign(payload);
}

function verifyToken(token) {
  if (!secret() || typeof token !== 'string') return false;
  const dot = token.indexOf('.');
  if (dot < 1) return false;
  const payload = token.slice(0, dot);
  const given   = Buffer.from(token.slice(dot + 1));
  const want    = Buffer.from(sign(payload));
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof exp === 'number' && Date.now() < exp;
  } catch { return false; }
}

// Compares via fixed-length digests so neither the timing nor the length of the comparison
// leaks anything about the real password.
function passwordMatches(given) {
  const expected = process.env.ADMIN_PASSWORD || '';
  if (!expected || typeof given !== 'string') return false;
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

// Best-effort only: serverless instances are per-region and recycled, so this slows a
// casual guesser rather than a determined distributed one. The real protection is that
// the password is no longer in the client bundle.
const attempts = new Map();
function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  return (Array.isArray(fwd) ? fwd[0] : String(fwd || '')).split(',')[0].trim()
    || req.socket?.remoteAddress || 'unknown';
}
function lockedOut(ip) {
  const rec = attempts.get(ip);
  if (!rec) return false;
  if (Date.now() > rec.until) { attempts.delete(ip); return false; }
  return rec.n >= MAX_ATTEMPTS;
}
function noteFailure(ip) {
  const rec = attempts.get(ip) || { n: 0, until: 0 };
  rec.n += 1;
  rec.until = Date.now() + LOCKOUT_MS;
  attempts.set(ip, rec);
}
function clearFailures(ip) { attempts.delete(ip); }

// Guard for the write endpoints. Returns true when the caller may proceed; otherwise it has
// already written the response.
function requireAuth(req, res) {
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'Server misconfiguration: ADMIN_PASSWORD not set' }), false;
  }
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!verifyToken(token)) {
    return res.status(401).json({ error: 'Your session expired. Reload the editor and sign in again.' }), false;
  }
  return true;
}

module.exports = {
  SESSION_TTL_MS, issueToken, verifyToken, passwordMatches,
  clientIp, lockedOut, noteFailure, clearFailures, requireAuth,
};
