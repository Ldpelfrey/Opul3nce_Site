// api/auth.js — trades the admin password for a short-lived session token.
//
// This is the only place the password is ever checked, and it happens on the server.
// The browser never receives it; it receives a signed token with an expiry instead.

const { issueToken, passwordMatches, clientIp, lockedOut, noteFailure, clearFailures,
        SESSION_TTL_MS } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!process.env.ADMIN_PASSWORD) {
    console.error('ADMIN_PASSWORD environment variable is not set');
    return res.status(500).json({ error: 'Server misconfiguration: ADMIN_PASSWORD not set' });
  }

  const ip = clientIp(req);
  if (lockedOut(ip)) {
    return res.status(429).json({ error: 'Too many tries. Wait about ten minutes and try again.' });
  }

  const given = req.body && req.body.password;
  if (!passwordMatches(given)) {
    noteFailure(ip);
    // Deliberately identical wording for a wrong password and a missing one — nothing here
    // should help someone work out whether they are close.
    return res.status(401).json({ error: 'That password is not right.' });
  }

  clearFailures(ip);
  return res.status(200).json({ token: issueToken(), expires_in: SESSION_TTL_MS });
};
