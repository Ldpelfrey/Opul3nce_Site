// api/lead.js: funnel lead capture. Validates (api/_lib/lead.js), then writes to every sink that
// is configured: the store (api/_lib/store.js) and an email via the existing Gmail path.
// 200 means at least one sink took it. Logs sink errors, never lead details.

const nodemailer = require('nodemailer');
const { validate } = require('./_lib/lead.js');
const store = require('./_lib/store.js');

// Best-effort, per-instance (same pattern as api/submit.js).
const HITS = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 6;
function rateLimited(ip) {
  const now = Date.now();
  const hits = (HITS.get(ip) || []).filter(t => now - t < WINDOW_MS);
  hits.push(now);
  HITS.set(ip, hits);
  if (HITS.size > 500) for (const [k, v] of HITS) if (!v.some(t => now - t < WINDOW_MS)) HITS.delete(k);
  return hits.length > LIMIT;
}

function emailConfigured() { return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD); }

async function notify(lead) {
  const user = process.env.GMAIL_USER;
  const to = process.env.ENQUIRY_TO || user;
  const who = lead.name || lead.phone || lead.email;
  const lines = [
    `Kind: ${lead.kind}`, `Name: ${lead.name}`, `Phone: ${lead.phone}`, `Email: ${lead.email}`,
    `Contact by: ${lead.channel}`, `Interest: ${lead.interest}`, `Item: ${lead.item}`,
    `Dates: ${lead.dates}`, `City: ${lead.city}`, `Consent to text: ${lead.consent ? 'yes' : 'no'}`,
    `Source: ${lead.source}`, `Page: ${lead.page}`, `Referrer: ${lead.referrer}`,
    ...Object.entries(lead.utm || {}).map(([k, v]) => `utm_${k}: ${v}`),
    `Received: ${lead.ts}`, `Id: ${lead.id}`, '', 'Message:', lead.message,
  ];
  const transport = nodemailer.createTransport({ service: 'gmail', auth: { user, pass: process.env.GMAIL_APP_PASSWORD } });
  await transport.sendMail({
    from: `"Opul3nce leads" <${user}>`,
    to,
    ...(lead.email ? { replyTo: lead.email } : {}),
    subject: `Lead: ${lead.kind} · ${lead.interest || lead.item || '-'} · ${who}`,
    text: lines.join('\n'),
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const fwd = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(fwd) ? fwd[0] : String(fwd || '')).split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) return res.status(429).json({ error: 'Too many requests from this address. Call the desk.' });

  const r = validate(req.body);
  if (r.ok && r.spam) return res.status(200).json({ ok: true });
  if (!r.ok) return res.status(400).json({ error: `Missing ${r.problems.join(', ')}.`, problems: r.problems });

  const lead = r.lead;
  const sinks = [];
  if (store.configured()) sinks.push(['store', () => store.save(lead)]);
  if (emailConfigured()) sinks.push(['email', () => notify(lead)]);
  if (!sinks.length) {
    console.error('lead: no sink configured (BLOB_READ_WRITE_TOKEN / LEADS_DIR / GMAIL_*)');
    return res.status(503).json({ error: 'The form is not switched on yet.' });
  }

  let okCount = 0;
  for (const [name, run] of sinks) {
    try { await run(); okCount++; }
    catch (err) { console.error(`lead: ${name} sink failed:`, err && (err.code || err.name) || 'error'); }
  }
  if (!okCount) return res.status(502).json({ error: 'Could not send. Call the desk.' });
  return res.status(200).json({ ok: true, id: lead.id });
};
module.exports._reset = () => HITS.clear();
