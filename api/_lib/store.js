// api/_lib/store.js: where leads are kept. One interface: configured(), save(lead), list({limit}).
// Vercel Blob (private access) when BLOB_READ_WRITE_TOKEN is set; a local directory when LEADS_DIR
// is set (dev and tests only). Neither set -> configured() is false and the API says so.

const fs = require('fs');
const path = require('path');

const mode = () => (process.env.BLOB_READ_WRITE_TOKEN ? 'blob' : process.env.LEADS_DIR ? 'fs' : null);
const configured = () => mode() !== null;

async function save(lead) {
  const m = mode();
  if (m === 'blob') {
    const { put } = require('@vercel/blob');
    await put(`leads/${lead.id}.json`, JSON.stringify(lead), {
      access: 'private', contentType: 'application/json', addRandomSuffix: true,
    });
    return;
  }
  if (m === 'fs') {
    fs.mkdirSync(process.env.LEADS_DIR, { recursive: true });
    fs.writeFileSync(path.join(process.env.LEADS_DIR, `${lead.id}.json`), JSON.stringify(lead));
    return;
  }
  throw new Error('store not configured');
}

// Newest first. Ids start with a UTC timestamp, so a descending sort on the name is newest first.
async function list({ limit = 500 } = {}) {
  const m = mode();
  if (m === 'fs') {
    const dir = process.env.LEADS_DIR;
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().reverse().slice(0, limit)
      .map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
  }
  if (m === 'blob') {
    const { list: blobList, get } = require('@vercel/blob');
    const all = [];
    let cursor;
    do {
      const page = await blobList({ prefix: 'leads/', cursor, limit: 1000 });
      all.push(...page.blobs);
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    all.sort((a, b) => (a.pathname < b.pathname ? 1 : -1));
    const out = [];
    for (const b of all.slice(0, limit)) {
      try {
        const r = await get(b.pathname, { access: 'private' });
        if (r && r.stream) out.push(JSON.parse(await new Response(r.stream).text()));
      } catch (e) { console.error('leads read error:', e.name || 'error'); }
    }
    return out;
  }
  throw new Error('store not configured');
}

module.exports = { configured, save, list };
