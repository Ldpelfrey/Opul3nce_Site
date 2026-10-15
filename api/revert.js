// api/revert.js — Vercel serverless function.
// "Undo" for the admin panel: since every Publish is a real git commit to
// content.json, reverting means finding the commit BEFORE the current one
// and re-committing that older version as a brand-new commit (never rewrites
// history — safe even if someone published again in the meantime).

const REPO        = 'Ldpelfrey/Opul3nce_Site';
const BRANCH      = 'main';
const FILE        = 'content.json';
const COMMITS_API  = `https://api.github.com/repos/${REPO}/commits?path=${FILE}&sha=${BRANCH}&per_page=2`;
const CONTENTS_API = ref => `https://api.github.com/repos/${REPO}/contents/${FILE}?ref=${ref}`;
const PUT_API      = `https://api.github.com/repos/${REPO}/contents/${FILE}`;

const { requireAuth } = require('./_lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!requireAuth(req, res)) return;

  const token = process.env.GITHUB_CONTENT_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Server misconfiguration: GITHUB_CONTENT_TOKEN not set' });
  }

  const headers = {
    Authorization:  `token ${token}`,
    Accept:         'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent':   'opul3nce-admin-function',
  };

  try {
    const commitsRes = await fetch(COMMITS_API, { headers });
    if (!commitsRes.ok) throw new Error(`GitHub commits lookup failed: ${commitsRes.status}`);
    const commits = await commitsRes.json();

    if (commits.length < 2) {
      return res.status(409).json({ error: 'No earlier version of content.json to revert to.' });
    }

    const previousSha = commits[1].sha;

    const prevContentRes = await fetch(CONTENTS_API(previousSha), { headers });
    if (!prevContentRes.ok) throw new Error(`Could not fetch previous version: ${prevContentRes.status}`);
    const prevFile = await prevContentRes.json();

    const currentRes = await fetch(PUT_API, { headers });
    if (!currentRes.ok) throw new Error(`Could not read current file sha: ${currentRes.status}`);
    const currentSha = (await currentRes.json()).sha;

    const putRes = await fetch(PUT_API, {
      method:  'PUT',
      headers,
      body: JSON.stringify({
        message: `content: revert to previous version (${previousSha.slice(0, 7)}) via admin panel`,
        content: prevFile.content,
        sha:     currentSha,
        branch:  BRANCH,
      }),
    });

    if (!putRes.ok) {
      const err = await putRes.json().catch(() => ({}));
      throw new Error(err.message || `GitHub PUT error: ${putRes.status}`);
    }

    const result = await putRes.json();
    return res.status(200).json({ success: true, commit: result.commit.sha.slice(0, 7) });

  } catch (err) {
    console.error('revert function error:', err);
    return res.status(500).json({ error: err.message });
  }
};
