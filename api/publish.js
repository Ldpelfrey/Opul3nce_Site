// api/publish.js — Vercel serverless function.
// Receives edited content JSON from the admin panel, validates it server-side
// (never trust the client), and commits it straight to GitHub `main` via the
// Contents API. That push is what triggers Vercel's git integration to
// auto-build and redeploy — no separate deploy-hook call needed.
//
// GITHUB_CONTENT_TOKEN is read from Vercel env vars — never sent to the
// browser, never present in any client bundle.

const REPO   = 'Ldpelfrey/Opul3nce_Site';
const BRANCH = 'main';
const FILE   = 'content.json';
const API    = `https://api.github.com/repos/${REPO}/contents/${FILE}`;

const URL_RE   = /^https?:\/\/.+/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Media may be hosted (https://) or committed alongside the site (assets/… or /assets/…).
const MEDIA_RE = /^(https?:\/\/.+|\/?assets\/.+)$/i;
const HEX_RE   = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
// Must stay in step with FONTS in theme.js. A font id the site can't render would ship a
// broken family, so an unknown id is rejected rather than silently falling back.
const FONT_IDS = ['bodoni-moda','instrument-serif','cormorant','fraunces'];
const THEME_COLORS = ['bone','bone2','ink','ink2','leaf','leafLift'];

const { requireAuth } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth first: never do any work, or reveal anything about config, for an unauthenticated caller.
  if (!requireAuth(req, res)) return;

  const token = process.env.GITHUB_CONTENT_TOKEN;
  if (!token) {
    console.error('GITHUB_CONTENT_TOKEN environment variable is not set');
    return res.status(500).json({ error: 'Server misconfiguration: GITHUB_CONTENT_TOKEN not set' });
  }

  const content = req.body && req.body.content;
  if (!content || typeof content !== 'object') {
    return res.status(400).json({ error: 'Missing content object' });
  }

  const problems = validate(content);
  if (problems.length) {
    return res.status(422).json({ error: 'Content failed validation', details: problems });
  }

  const headers = {
    Authorization:  `token ${token}`,
    Accept:         'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent':   'opul3nce-admin-function',
  };

  try {
    let sha;
    const getRes = await fetch(API, { headers });

    if (getRes.ok) {
      sha = (await getRes.json()).sha;
    } else if (getRes.status !== 404) {
      const err = await getRes.json().catch(() => ({}));
      throw new Error(err.message || `GitHub GET error: ${getRes.status}`);
    }

    const jsonStr = JSON.stringify(content, null, 2);
    const encoded = Buffer.from(jsonStr, 'utf8').toString('base64');

    const putRes = await fetch(API, {
      method:  'PUT',
      headers,
      body: JSON.stringify({
        message: `content: update via admin panel — ${new Date().toISOString()}`,
        content: encoded,
        branch:  BRANCH,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!putRes.ok) {
      const err = await putRes.json().catch(() => ({}));
      throw new Error(err.message || `GitHub PUT error: ${putRes.status}`);
    }

    const result = await putRes.json();
    return res.status(200).json({
      success: true,
      commit:  result.commit.sha.slice(0, 7),
    });

  } catch (err) {
    console.error('publish function error:', err);
    return res.status(500).json({ error: err.message });
  }
};

function validate(c) {
  const problems = [];

  // ── required strings ────────────────────────────────────────────────────
  if (!c.meta?.title?.trim())        problems.push('Page title is required.');
  if (!c.meta?.description?.trim())  problems.push('Meta description is required — the live site shipped without one.');
  if (!c.brand?.name?.trim())        problems.push('Brand name is required.');
  if (!c.hero?.headline?.trim())     problems.push('Hero headline is required.');

  const email = c.contact?.email?.trim();
  if (!email || !EMAIL_RE.test(email)) {
    problems.push('Contact email is missing or not a valid email address.');
  }
  if (!c.contact?.phone?.trim()) problems.push('Contact phone is required.');

  // ── URLs ────────────────────────────────────────────────────────────────
  if (c.contact?.instagram && !URL_RE.test(c.contact.instagram)) {
    problems.push('Instagram URL must start with http:// or https://');
  }
  if (c.meta?.canonical && !URL_RE.test(c.meta.canonical)) {
    problems.push('Canonical URL must start with http:// or https://');
  }
  // MEDIA_RE deliberately accepts relative assets/… paths. Requiring https://
  // would reject every real media path on publish. Do not tighten it.
  if (c.meta?.ogImage && !MEDIA_RE.test(c.meta.ogImage)) {
    problems.push('OG image must be an https:// URL or an assets/ path.');
  }

  // ── catalogue: the money section ────────────────────────────────────────
  const lots = c.catalogue?.lots;
  if (!Array.isArray(lots) || lots.length === 0) {
    problems.push('The catalogue must contain at least one lot.');
  } else {
    const seen = new Set();
    lots.forEach((l, i) => {
      const n = `Lot ${i + 1}`;
      if (!l.name?.trim())  problems.push(`${n}: name is required.`);
      if (!l.lot?.trim())   problems.push(`${n}: lot number is required.`);
      else if (seen.has(l.lot)) problems.push(`${n}: lot number "${l.lot}" is used twice.`);
      else seen.add(l.lot);
      if (!l.image || !MEDIA_RE.test(l.image)) {
        problems.push(`${n}: image must be an https:// URL or an assets/ path.`);
      }
      // Alt text is not optional here — 29 of 54 images on the live site ship without it.
      if (!l.alt?.trim()) problems.push(`${n}: alt text is required (describe the vehicle, not the filename).`);
      if (!l.class?.trim()) problems.push(`${n}: class is required or the filters cannot place it.`);
    });

    // A lot whose class is not in the filter list becomes unreachable in the UI.
    const filters = Array.isArray(c.catalogue?.filters) ? c.catalogue.filters : [];
    if (filters.length) {
      lots.forEach((l, i) => {
        if (l.class && !filters.includes(l.class)) {
          problems.push(`Lot ${i + 1}: class "${l.class}" is not in the filter list, so it can never be shown.`);
        }
      });
    }
  }
  if (!c.catalogue?.rateFallback?.trim()) {
    problems.push('Rate fallback text is required — a missing price must never render blank.');
  }

  // ── repeating text blocks ───────────────────────────────────────────────
  const lists = [
    ['position.items',   c.position?.items,   ['figure', 'label']],
    ['beyond.items',     c.beyond?.items,     ['title', 'body']],
    ['proof.quotes',     c.proof?.quotes,     ['quote', 'name']],
    ['desk.people',      c.desk?.people,      ['name', 'role']],
    ['business.services',c.business?.services,['title', 'body']],
  ];
  for (const [label, arr, keys] of lists) {
    if (arr === undefined) continue;
    if (!Array.isArray(arr)) { problems.push(`${label} must be a list.`); continue; }
    arr.forEach((item, i) => {
      keys.forEach(k => {
        if (!item?.[k]?.toString().trim()) problems.push(`${label}[${i + 1}]: ${k} is required.`);
      });
    });
  }

  // Markets are stated in exactly one place so the footer and any map agree.
  if (c.footer?.markets !== undefined) {
    if (!Array.isArray(c.footer.markets) || c.footer.markets.length === 0) {
      problems.push('At least one market is required.');
    }
  }
  if (Array.isArray(c.footer?.legal) && Array.isArray(c.footer?.legalHref)
      && c.footer.legal.length !== c.footer.legalHref.length) {
    problems.push('Each legal link needs a matching href — a mismatch ships a dead link.');
  }
  if (Array.isArray(c.enquire?.interests) && c.enquire.interests.length === 0) {
    problems.push('The enquiry form needs at least one interest option.');
  }

  // ── theme ───────────────────────────────────────────────────────────────
  if (c.theme?.font && !FONT_IDS.includes(c.theme.font)) {
    problems.push(`Unknown font id "${c.theme.font}" — the site could not render it.`);
  }
  if (c.theme?.palette) {
    for (const k of THEME_COLORS) {
      const v = c.theme.palette[k];
      if (v && !HEX_RE.test(v)) problems.push(`Theme colour "${k}" must be a hex value like #EDE9E2.`);
    }
  }

  return problems;
}
