// api/leads.js: admin-only read of stored leads. GET /api/leads -> {leads}; ?format=csv -> download.
const { requireAuth } = require('./_lib/auth.js');
const store = require('./_lib/store.js');

const COLS = ['ts', 'kind', 'name', 'phone', 'email', 'channel', 'interest', 'item', 'dates', 'city',
  'source', 'utm_source', 'utm_medium', 'utm_campaign', 'consent', 'message'];

function cell(v) {
  let s = String(v == null ? '' : v);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function toCsv(leads) {
  const rows = leads.map(l => COLS.map(c => {
    if (c.startsWith('utm_')) return cell((l.utm || {})[c.slice(4)]);
    if (c === 'consent') return cell(l.consent ? 'yes' : 'no');
    return cell(l[c]);
  }).join(','));
  return [COLS.join(','), ...rows].join('\r\n') + '\r\n';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAuth(req, res)) return;
  if (!store.configured()) return res.status(503).json({ error: 'Lead storage is not switched on yet.' });
  let leads;
  try { leads = await store.list({ limit: 500 }); }
  catch (err) { console.error('leads: read failed:', err && err.name || 'error'); return res.status(502).json({ error: 'Could not read leads.' }); }
  res.setHeader('Cache-Control', 'no-store');
  if (req.query && req.query.format === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="opul3nce-leads.csv"');
    return res.status(200).send(toCsv(leads));
  }
  return res.status(200).json({ leads });
};
