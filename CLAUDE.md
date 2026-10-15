# CLAUDE.md — Opul3nce_Site

## What this is

A flagship-homepage **redesign** of opul3nce.io (Opul3nce Luxury Concierge — Johnathan Eden's
Scottsdale exotic-rental and concierge business). Built on the shared static stack, deployed as a
**noindex'd pitch build**. It is not the client's production site.

> **opul3nce.io is NOT tryopulenceai.com.** Different companies. Don't cross-apply facts from the
> Opulence AI blog-SEO project.

Read in this order: `HANDOFF.md` (operational detail, owns the truth) → `AUDIT.md` (why the redesign
looks like this) → `BUILD-PROMPT.md` (the spec that was run).
Vault master note: `team-vault/Projects/Opul3nce-Site-Redesign.md`.
Shared stack rules: `~/EPK-Infrastructure-Project/EPK-Build-Context.md`.

## Run / build / deploy

```bash
# local — NEVER file://, the content.json fetch fails silently and you debug stale DEFAULT_CONTENT
python3 -m http.server 8137          # 8137 is this project's. 8099 = Desert Hydra, 8123 = JennBurg
open http://localhost:8137/index.html
open http://localhost:8137/admin/    # detects a static server (POST → 501), opens preview-only

vercel --prod                        # deploy. No GitHub repo, so there is no git-push auto-deploy.
```

Node is pinned to **22.x** in `package.json` — Vercel defaults new projects to 24 and the build fails.

## Current state (2026-09-06)

- **Live: https://opul3nce-site.vercel.app** — verified 200 with a logged-out curl.
- Vercel project `opul3nce-site`, team `lucas-pelfrey-s-projects`. **No GitHub repo.**
- Verified at 1440px and 390px: contrast **212/212** and **206/206**, 1 `<h1>`, 0 dead links,
  0 broken images, 0 missing alt, 0 console errors, 0 failed requests.
- `noindex, nofollow` + `robots.txt Disallow: /` are **deliberate** — this is an unsolicited
  redesign of a third party's brand and must never be mistaken for the real opul3nce.io.
  **Remove both only if it becomes production.**

### Env (placeholders)

| Var | State |
|---|---|
| `ADMIN_PASSWORD` | set — random; value at `~/.config/opul3nce/admin-password` (0600) |
| `ADMIN_SESSION_SECRET` | set — random |
| `ENQUIRY_TO` | Lucas.Pelfrey.Business@gmail.com, so a test enquiry can't reach the client |
| `GITHUB_CONTENT_TOKEN` | **deliberately unset** → Publish hits the designed "not switched on yet" path |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | **deliberately unset** → the form 503s honestly |

## Rules this build holds — don't break them

- **Never write a secret into this directory.** `.gitignore` does **not** apply to Vercel uploads —
  only `.vercelignore` does. An admin password leaked publicly here for ~4 min that way. Secrets go
  in `~/.config/opul3nce/`.
- **Every `content.json` field needs an input in `admin/`'s `SECTIONS`**, or nobody can edit it.
  The editor mutates the loaded object and publishes it **whole** — never rebuild from the DOM.
- **`DEFAULT_CONTENT` in `index.html` mirrors `content.json`.** Re-mirror on every content change.
- Adding a field touches **four** places: `content.json`, admin `SECTIONS`, `DEFAULT_CONTENT`, and
  the `api/publish.js` validator.
- **Internal notes must live in fields with no `data-c` binding** (`_specNoteInternal`, `plateNote`,
  `footnote`, `sourceNote`). A `[VERIFY]` marker once rendered to visitors.
- **`MEDIA_RE` accepts relative `assets/…` paths — do not tighten it to https-only**, that rejects
  every real media path on publish.
- **Read the token that is applied, not the one declared.** `theme.js` derives `--muted` and
  `--muted-ink` at boot and overrides the `:root` values. Two golds exist because one cannot pass
  contrast on both bone and ink.
- Display ceiling **6rem/96px**. No stacked uppercase kickers. `figure{margin:0}`.
- Admin element ids must be selector-safe — a literal dot makes `#f_a.b` parse as id + class.

## Verifying a change

1. Serve locally on 8137, never `file://`.
2. Playwright at **390px and 1440px**: 0 console errors, 0 failed requests, no broken images,
   `scrollWidth === clientWidth`, and measure contrast on rendered nodes.
3. **Screenshot both and actually look.** Three real bugs here passed every assertion first.
4. Scroll at **≥190 ms/step** when screenshotting — faster outruns the IntersectionObserver and
   fakes a blank-section bug that isn't there.
5. After deploying, re-verify against the **live URL** and curl the dotfiles. `vercel --prod`
   reporting success is not proof.

## Don't invent

Rates, mileage caps, deposits, insurance terms, delivery radius, minimum age, market counts and
review provenance are **business facts nobody has supplied**. They render honest fallbacks
("Rate on request"). A fabricated rate card is worse than a blank one. And do not substitute stock
imagery for the Arizona hero — the live site using Dubai stock is the exact failure being corrected.
