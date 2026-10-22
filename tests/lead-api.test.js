const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'leads-'));
for (const k of ['BLOB_READ_WRITE_TOKEN', 'LEADS_DIR', 'GMAIL_USER', 'GMAIL_APP_PASSWORD', 'ENQUIRY_TO']) delete process.env[k];
process.env.ADMIN_PASSWORD = 'test-only-pw';
process.env.ADMIN_SESSION_SECRET = 'test-only-secret';

const nodemailer = require('nodemailer');
const sent = [];
let mailFails = false;
nodemailer.createTransport = () => ({ sendMail: async m => { if (mailFails) throw new Error('smtp down'); sent.push(m); } });

const lead = require('../api/lead.js');
const leads = require('../api/leads.js');
const store = require('../api/_lib/store.js');
const { issueToken } = require('../api/_lib/auth.js');

const mkRes = () => { const r = { code: 0, body: null, headers: {} };
  r.status = c => { r.code = c; return r; }; r.json = b => { r.body = b; return r; }; r.send = b => { r.body = b; return r; };
  r.setHeader = (k, v) => { r.headers[k] = v; }; return r; };
const post = async (body, ip = '1.1.1.1', method = 'POST') => { const res = mkRes(); await lead({ method, headers: { 'x-forwarded-for': ip }, body }, res); return res; };
const valid = (o = {}) => ({ kind: 'request', name: 'Ana Ruiz', phone: '(602) 555-0142', channel: 'call', item: 'G63', ...o });
const files = () => (fs.existsSync(dir) ? fs.readdirSync(dir) : []);
const clear = () => { fs.rmSync(dir, { recursive: true, force: true }); lead._reset(); sent.length = 0; };
const quiet = fn => async () => { const e = console.error; console.error = () => {}; try { await fn(); } finally { console.error = e; } };

const blocker = path.join(os.tmpdir(), 'leads-blocker-' + process.pid);
fs.writeFileSync(blocker, 'x');
const BADDIR = path.join(blocker, 'sub'); // a path under a regular file: mkdir fails with ENOTDIR

const t = [];
const it = (n, f) => t.push([n, f]);

it('(a) valid -> 200, file stored', async () => {
  clear(); process.env.LEADS_DIR = dir;
  const r = await post(valid());
  assert.strictEqual(r.code, 200); assert(r.body.ok && r.body.id);
  assert.strictEqual(files().length, 1);
  assert.strictEqual(JSON.parse(fs.readFileSync(path.join(dir, files()[0]), 'utf8')).name, 'Ana Ruiz');
});
it('(b) invalid -> 400 with problems', async () => {
  clear(); process.env.LEADS_DIR = dir;
  const r = await post({ kind: 'request', name: '' });
  assert.strictEqual(r.code, 400); assert(Array.isArray(r.body.problems) && r.body.problems.includes('name')); assert(/^Missing /.test(r.body.error));
  assert.strictEqual(files().length, 0);
});
it('(c) honeypot -> 200, nothing stored or mailed', async () => {
  clear(); process.env.LEADS_DIR = dir; process.env.GMAIL_USER = 'x@example.com'; process.env.GMAIL_APP_PASSWORD = 'p';
  const r = await post(valid({ company: 'Acme' }));
  assert.strictEqual(r.code, 200); assert.deepStrictEqual(r.body, { ok: true });
  assert.strictEqual(files().length, 0); assert.strictEqual(sent.length, 0);
  delete process.env.GMAIL_USER; delete process.env.GMAIL_APP_PASSWORD;
});
it('(d) no sinks -> 503', quiet(async () => {
  clear(); delete process.env.LEADS_DIR;
  const r = await post(valid()); assert.strictEqual(r.code, 503); assert(/not switched on/.test(r.body.error));
}));
it('(e) store throws, email works -> 200 (+ email content)', quiet(async () => {
  clear(); process.env.LEADS_DIR = BADDIR; process.env.GMAIL_USER = 'x@example.com'; process.env.GMAIL_APP_PASSWORD = 'p';
  const r = await post(valid({ email: 'ana@ex.com', utm: { source: 'ig' }, interest: 'Exotic rental' }));
  assert.strictEqual(r.code, 200); assert.strictEqual(sent.length, 1); assert.strictEqual(files().length, 0);
  assert.strictEqual(sent[0].replyTo, 'ana@ex.com');
  assert(sent[0].subject.startsWith('Lead: request · Exotic rental · Ana Ruiz'), sent[0].subject);
  assert(/utm_source: ig/.test(sent[0].text));
}));
it('(f) both fail -> 502', quiet(async () => {
  clear(); process.env.LEADS_DIR = BADDIR; mailFails = true;
  const r = await post(valid()); mailFails = false;
  assert.strictEqual(r.code, 502);
  delete process.env.GMAIL_USER; delete process.env.GMAIL_APP_PASSWORD;
}));
it('(g) 7th hit from one IP -> 429', async () => {
  clear(); process.env.LEADS_DIR = dir; const codes = [];
  for (let i = 0; i < 7; i++) codes.push((await post(valid(), '9.9.9.9')).code);
  assert.deepStrictEqual(codes, [200, 200, 200, 200, 200, 200, 429]);
  assert.strictEqual((await post(valid(), '8.8.8.8')).code, 200);
});
it('(h) /api/leads: 401 without session; newest first with one', async () => {
  clear(); process.env.LEADS_DIR = dir;
  await post(valid({ name: 'First' })); await new Promise(r => setTimeout(r, 1100)); await post(valid({ name: 'Second' }));
  let res = mkRes(); await leads({ method: 'GET', headers: {}, query: {} }, res); assert.strictEqual(res.code, 401);
  res = mkRes(); await leads({ method: 'GET', headers: { authorization: 'Bearer ' + issueToken() }, query: {} }, res);
  assert.strictEqual(res.code, 200); assert.deepStrictEqual(res.body.leads.map(l => l.name), ['Second', 'First']);
  delete process.env.LEADS_DIR;
  res = mkRes(); await leads({ method: 'GET', headers: { authorization: 'Bearer ' + issueToken() }, query: {} }, res); assert.strictEqual(res.code, 503);
});
it('(i) CSV: header, escaping, formula neutralised', async () => {
  clear(); process.env.LEADS_DIR = dir;
  await post(valid({ name: '=SUM(1)', message: 'Hi, "there" ok', utm: { source: 'ig' } }));
  const res = mkRes(); await leads({ method: 'GET', headers: { authorization: 'Bearer ' + issueToken() }, query: { format: 'csv' } }, res);
  assert.strictEqual(res.code, 200); assert(/text\/csv/.test(res.headers['Content-Type'])); assert(/attachment/.test(res.headers['Content-Disposition']));
  const csv = res.body;
  assert(csv.startsWith('ts,kind,name,phone,email,channel,interest,item,dates,city,source,utm_source,utm_medium,utm_campaign,consent,message\r\n'));
  assert(csv.includes(",'=SUM(1),"), csv); assert(csv.includes('"Hi, ""there"" ok"'), csv); assert(csv.includes(',ig,'));
});
it('(j) GET /api/lead -> 405', async () => { clear(); const r = await post(null, '2.2.2.2', 'GET'); assert.strictEqual(r.code, 405); });

(async () => {
  let fail = 0;
  for (const [n, f] of t) { try { await f(); console.log('ok  ', n); } catch (e) { fail++; console.log('FAIL', n, '-', e.message); } }
  fs.rmSync(dir, { recursive: true, force: true }); fs.rmSync(blocker, { force: true });
  console.log(fail ? `LEAD API TESTS FAIL (${fail})` : `LEAD API TESTS PASS (${t.length})`); process.exit(fail ? 1 : 0);
})();
