// api/_lib/lead.js: the lead contract. Pure: normalises and validates one funnel submission.
// Every capture point on the page (concierge request, fleet-menu offer, ecosystem list) posts here via api/lead.js.
// Tested by tests/lead.test.js. Change the rules here and in the test together.

const crypto = require('crypto');

const KINDS = ['request', 'menu', 'list'];
const CHANNELS = ['text', 'call', 'whatsapp', 'email'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UTM = ['source', 'medium', 'campaign', 'term', 'content'];

const clean = (v, n = 300) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n);
const digits = p => p.replace(/\D/g, '');

function normalize(body) {
  const b = body && typeof body === 'object' ? body : {};
  const utm = {};
  for (const k of UTM) { const v = clean(b.utm && b.utm[k], 120); if (v) utm[k] = v; }
  return {
    kind: clean(b.kind, 20),
    name: clean(b.name, 120),
    email: clean(b.email, 200).toLowerCase(),
    phone: clean(b.phone, 40),
    channel: clean(b.channel, 20) || (clean(b.phone) ? 'text' : 'email'),
    interest: clean(b.interest, 80),
    item: clean(b.item, 120),
    dates: clean(b.dates, 120),
    city: clean(b.city, 80),
    message: clean(b.message, 4000),
    consent: b.consent === true || b.consent === 'true' || b.consent === 'on',
    source: clean(b.source, 60),
    page: clean(b.page, 300),
    referrer: clean(b.referrer, 300),
    utm,
    _trap: clean(b.company, 200),          // honeypot: a hidden field people never fill
  };
}

// -> { ok: true, lead } | { ok: false, problems: [...] } | { ok: true, spam: true }
function validate(body, now = new Date()) {
  const l = normalize(body);
  if (l._trap) return { ok: true, spam: true };
  const problems = [];
  if (!KINDS.includes(l.kind)) problems.push('kind');
  if (!CHANNELS.includes(l.channel)) problems.push('channel');
  if (l.email && !EMAIL_RE.test(l.email)) problems.push('a valid email');
  const d = digits(l.phone);
  if (l.phone && (d.length < 7 || d.length > 15)) problems.push('a valid phone number');
  if (!l.email && !l.phone) problems.push('a phone number or email');
  if (l.kind === 'request' && !l.name) problems.push('name');
  if (['text', 'call', 'whatsapp'].includes(l.channel) && !l.phone) problems.push('a phone number for that contact method');
  if (l.channel === 'email' && !l.email) problems.push('an email for that contact method');
  if (['text', 'whatsapp'].includes(l.channel) && !l.consent) problems.push('consent to be texted');
  if (problems.length) return { ok: false, problems };
  delete l._trap;
  l.id = `${now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${crypto.randomBytes(3).toString('hex')}`;
  l.ts = now.toISOString();
  return { ok: true, lead: l };
}

module.exports = { validate, normalize, KINDS, CHANNELS };
