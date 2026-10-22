// node tests/lead.test.js : the lead contract (api/_lib/lead.js). Exits 1 on any failure.
const assert = require('assert');
const { validate } = require('../api/_lib/lead.js');

const base = { kind: 'request', name: 'Ana Ruiz', phone: '(602) 555-0142', channel: 'text', consent: true, item: 'Mercedes-AMG G63' };
const t = [];
const it = (name, fn) => t.push([name, fn]);
const bad = (body, word) => { const r = validate(body); assert.strictEqual(r.ok, false, JSON.stringify(r)); assert(r.problems.some(p => p.includes(word)), r.problems.join('|')); };

it('valid request by text', () => { const r = validate(base); assert(r.ok && r.lead.id && r.lead.ts && !('_trap' in r.lead)); });
it('request needs a name', () => bad({ ...base, name: '' }, 'name'));
it('needs phone or email', () => bad({ kind: 'menu', channel: 'email' }, 'phone number or email'));
it('text without consent rejected', () => bad({ ...base, consent: false }, 'consent'));
it('call needs no consent', () => assert(validate({ ...base, channel: 'call', consent: false }).ok));
it('whatsapp without phone rejected', () => bad({ ...base, phone: '', email: 'a@b.co', channel: 'whatsapp' }, 'phone number for'));
it('email channel needs email', () => bad({ ...base, channel: 'email' }, 'email for'));
it('bad email rejected', () => bad({ kind: 'menu', email: 'nope@', channel: 'email' }, 'valid email'));
it('short phone rejected', () => bad({ ...base, phone: '12345' }, 'valid phone'));
it('menu with email only', () => { const r = validate({ kind: 'menu', email: 'A@B.co' }); assert(r.ok && r.lead.channel === 'email' && r.lead.email === 'a@b.co'); });
it('list with phone defaults to text, needs consent', () => bad({ kind: 'list', phone: '6025550142' }, 'consent'));
it('unknown kind rejected', () => bad({ ...base, kind: 'spam' }, 'kind'));
it('honeypot silently dropped', () => { const r = validate({ ...base, company: 'Acme' }); assert(r.ok && r.spam && !r.lead); });
it('utm kept, junk keys dropped', () => { const r = validate({ ...base, utm: { source: 'ig', medium: 'paid', evil: 'x' } }); assert.deepStrictEqual(r.lead.utm, { source: 'ig', medium: 'paid' }); });
it('control chars stripped, lengths capped', () => { const r = validate({ ...base, name: 'A\u0000B', message: 'x'.repeat(9000) }); assert(r.lead.name === 'A B' && r.lead.message.length === 4000); });
it('non-object body', () => bad(null, 'kind'));

let fail = 0;
for (const [n, f] of t) { try { f(); console.log('ok  ', n); } catch (e) { fail++; console.log('FAIL', n, '-', e.message); } }
console.log(fail ? `LEAD TESTS FAIL (${fail})` : `LEAD TESTS PASS (${t.length})`); process.exit(fail ? 1 : 0);
