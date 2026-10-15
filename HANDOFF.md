# Opul3nce Site — HANDOFF

**Built 2026-09-06.** Flagship homepage redesign replacing the Webflow/BRIX build at opul3nce.io.
Read `AUDIT.md` for why, `BUILD-PROMPT.md` for the spec. This file owns the operational detail.

**Status: DEPLOYED to Vercel as a pitch build, 2026-09-06.**

- **Live: https://opul3nce-site.vercel.app** — verified reachable with a logged-out `curl` (200).
- Vercel project `opul3nce-site` (team `lucas-pelfrey-s-projects`). **No GitHub repo** — deployed
  straight from the directory, so there is no git-push auto-deploy. Redeploy with `vercel --prod`.
- **`noindex, nofollow` + `robots.txt Disallow: /`** are deliberate. This is an unsolicited redesign
  of a third party's brand on a vercel.app URL; it must never compete with, or be mistaken for, the
  real opul3nce.io. **Remove both if this ever becomes the production site.**
- The footer's legal links point at **absolute** opul3nce.io URLs, because this deploy has no
  `/terms-of-service` or `/privacy-policy` of its own — relative paths 404'd here (caught on live,
  not locally). Switch back to relative if this becomes production.

### Env vars as deployed (placeholders)

| Var | State | Why |
|---|---|---|
| `ADMIN_PASSWORD` | **set** — random, at `~/.config/opul3nce/admin-password` (0600) | lets the editor be demoed |
| `ADMIN_SESSION_SECRET` | set — random | so rotating the password doesn't silently reuse it |
| `ENQUIRY_TO` | set to **Lucas.Pelfrey.Business@gmail.com** | so a test enquiry can never reach the real client from a mockup |
| `GITHUB_CONTENT_TOKEN` | **deliberately unset** | a fake token makes Publish 401 confusingly; unset hits the designed "not switched on yet" path, and nothing can write to any repo |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | **deliberately unset** | the form 503s honestly instead of pretending to send |

### ⚠ Incident — admin password was briefly public (2026-09-06, fixed same session)

The password was written to `.admin-password.local` inside the project directory and added to
`.gitignore` — but **`.gitignore` does not apply to Vercel uploads**, only `.vercelignore` does. The
file deployed and was readable at `/.admin-password.local` (HTTP 200) for roughly four minutes.

Fixed at the root: the secret now lives at `~/.config/opul3nce/admin-password`, **outside any
deployed directory**; `.vercelignore` now excludes `.env*`, `*.local`, `.git*` and `.vercel`; and
**the exposed password was rotated** — the old value now returns 401, verified. `GITHUB_CONTENT_TOKEN`
was never set, so nothing could have been written even with the password.

**Rule: never write a secret into a directory that gets deployed. `.gitignore` is not a deploy
control.**

---

## 1. Run it

```bash
cd ~/Documents/Opul3nce_Site
python3 -m http.server 8137        # NOT file:// — the content.json fetch fails silently
open http://localhost:8137/index.html
open http://localhost:8137/admin/  # detects a static server, opens preview-only
```

Port 8137 is this project's. 8099 is Desert Hydra, 8123 is JennBurg.

## 2. Files

```
index.html        design system + markup + render/motion JS. No build step.
content.json      the CMS — every string, URL and media path
theme.js          font library + palette + WCAG maths, shared by site AND admin
epk.js            offscreen-video autoplay + [data-nav-toggle] nav (no video here yet)
admin/index.html  schema-driven editor, iframes the real page for preview
api/auth.js       ← ported BYTE-IDENTICAL from Desert Hydra (verified by md5)
api/_lib/auth.js  ← ported BYTE-IDENTICAL from Desert Hydra (verified by md5)
api/publish.js    Desert Hydra machinery, validator REWRITTEN for this content shape
api/revert.js     Desert Hydra, repo constant retargeted
api/submit.js     enquiry delivery via nodemailer — new to this build
assets/           10 vehicle WebPs, 475 KB total
reference/        live-site screenshots — gitignored, never commit
```

## 3. Verification actually run (2026-09-06)

Chromium via Playwright at 1440px and 390px. Run locally first, then **re-run against the live
URL** after deploy — `vercel --prod` reporting success is not proof. Both runs gave these numbers:

| Check | 1440px | 390px |
|---|---|---|
| Contrast (measured on rendered nodes) | **212 / 212 pass** | **206 / 206 pass** |
| Horizontal overflow | none | none |
| `<h1>` count | 1 | 1 |
| `href="#"` dead links | 0 | 0 |
| Broken images | 0 | 0 |
| Images missing alt | 0 | 0 |
| Console errors | 0 | 0 |
| Failed requests | 0 | 0 |
| Page height | 7,899 px | 12,872 px |

`prefers-reduced-motion`: 0 of 28 reveal elements stuck invisible.

**Live endpoint checks (production):** unauthenticated `POST /api/publish` → **401**, `/api/revert` →
**401**, forged bearer token → **401**, wrong password → 401, correct password → 200 + 12h token,
`/api/submit` → 503 (honest, creds unset), `/api/_lib/auth` → 404 (not routable). No password in
client source. `node_modules`, `*.md` and all dotfiles → 404. The `publish.js` validator was
exercised directly (it cannot be reached on live while the GitHub token is unset): 0 problems on
real content, 11 caught on deliberately broken content.
Screenshots were taken at both widths **and looked at** — that is what caught the three bugs in §4.

For comparison, the live site: 84 dead links, 7 broken images, 38 `<h1>` on `/exotic-cars`, no meta
description, `/partners` 17,598 px tall on mobile.

## 4. Bugs found by looking at the screenshots, not by the assertions

Every one of these passed every automated check first.

1. **`[VERIFY]` leaked onto the public page.** `catalogue.specNote` rendered "…are [VERIFY] — not
   published until Johnathan supplies them" to visitors, naming the client. The public string now
   says terms are confirmed at booking — true, and commits to nothing. The internal caveat moved to
   `catalogue._specNoteInternal`, which has no binding and cannot render.
2. **Lot cards misaligned across a grid row.** "Grand Wagoneer Series 3" wraps to two lines, which
   pushed its rate row out of step with its neighbours. `.lot` is now a flex column with
   `.lot-rate{margin-top:auto}`, so every rate row sits on the same line.
3. **Two grey voids in the business grid.** Six services in an `auto-fit` 4-column grid left two
   empty cells showing the grid's own 1px background as solid grey blocks. Pinned to 3 columns
   (2 at ≤900px, 1 at ≤560px) so the rows always fill.

**A fourth was a false alarm, and the record matters:** the first screenshot showed section headings
and whole blocks blank. That was my scroll loop (110 ms/step) outrunning the IntersectionObserver,
not a site bug — a slower scroll revealed all 28. The same artifact fooled me on the live site
earlier. It still pointed at a real risk (a fast mobile flick could do the same), so `initMotion()`
now carries a **sweep** safety net that force-reveals anything at or above the viewport bottom on
`load`, on `scroll`, on `fonts.ready`, on debounced `resize`, and at 400 ms. One pass is not enough,
for the same reason one `ScrollTrigger.refresh()` is not enough.

## 5. Contrast — measured, not estimated

My first token values were wrong and the browser caught them. Recorded so nobody restores them:

| Token | Was | Now | Why |
|---|---|---|---|
| `--leaf` | `#8A6D2F` | `#7A5D1F` | 4.03:1 on bone — **failed AA**. Now 5.08:1 on bone, 4.64:1 on bone-2 |
| `--muted` (derived) | `mix(ink,bone,0.42)` | `mix(ink,bone,0.34)` | 0.42 computed to `#6c6a66` = 4.07:1 on bone-2. Now 5.34:1 |
| `--muted-ink` (derived) | `mix(bone,ink,0.34)` | `mix(bone,ink,0.30)` | headroom; 8.06:1 on ink, 7.27:1 on ink-2 |
| form placeholder | `#6E6A62` | `#807C74` | 3.59:1 on ink — failed. Now 4.65:1 |

**The derived token overrode the authored one.** `theme.js` sets `--muted` at boot, so the correct
value in the `:root` block was irrelevant — the mix factor was the real source. Read the token that
is *applied*, not the one that is declared. Both golds are needed because one gold cannot pass on
both bone and ink; `--leaf` is bone-only and `--leaf-lift` is ink-only.

## 6. Before this goes live

**Blocked on Johnathan — nothing here was invented:**

- **Rates.** Every lot ships `"rate": null` and renders "Rate on request". A fabricated rate card is
  worse than a blank one. Fill `rate` per lot when real numbers exist.
- **Mileage caps, deposits, insurance terms, delivery radius, minimum age.** See
  `catalogue._specNoteInternal`.
- **The markets contradiction.** The live map pins 7 markets, every footer lists 3. This build ships
  3. Confirm which is true — it is stated once, in `footer.markets`.
- **Review provenance.** Five of the nine reviews say "host", which is peer-to-peer rental
  vocabulary. They ship as "Verified renter review". If they are Turo, saying so is *stronger* than
  an unattributed five-star card, because it is checkable. Do not name a platform until confirmed.
- **Arizona photography.** The hero is typographic on purpose. The live site's hero is Dubai Marina
  (EMAAR signage is legible in frame) under copy about Camelback Mountain and Old Town — that is the
  exact failure being corrected. **Do not substitute more stock.** A real Scottsdale/Sonoran shoot,
  or the type stands.
- Team portraits, and whether the B2B practice should live on this domain at all.

**Deployment:**

| Env var | Needed for | If unset |
|---|---|---|
| `ADMIN_PASSWORD` | publishing | `/api/auth` 500s → nothing publishes (fail-closed) |
| `GITHUB_CONTENT_TOKEN` | publishing | admin loads, Publish says "not switched on yet" |
| `ADMIN_SESSION_SECRET` | optional | defaults to `ADMIN_PASSWORD` |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | the enquiry form | form returns 503 and says so honestly |
| `ENQUIRY_TO` | optional | defaults to `johnathan@opul3nce.io` |

- `REPO` in `api/publish.js` and `api/revert.js` is `Ldpelfrey/Opul3nce_Site` — **create that repo or
  change the constant**, or publishing 404s.
- Node is pinned to 22.x in `package.json`. Vercel defaults new projects to 24 and the build fails.
- A `200` from `/api/submit` is **not** proof of delivery. Confirm the first enquiry lands.
- Re-verify against the live URL with a logged-out `curl`, not against this report.
- **Never send a Claude Artifact link to the client.**

## 7. Rules this build is holding

- Every `content.json` field has an input in admin's `SECTIONS`, **or publishing wipes it**. The
  editor mutates the loaded object and publishes it **whole** — it never rebuilds from the DOM.
- `DEFAULT_CONTENT` mirrors `content.json` (verified programmatically). **Re-mirror on every change.**
- Admin element ids are selector-safe — a literal dot makes `#f_a.b` parse as id + class.
- `initMotion()` awaits `DOMContentLoaded`.
- Adding a field touches **four** places: `content.json`, admin `SECTIONS`, `DEFAULT_CONTENT`, and
  the `api/publish.js` validator.
- `MEDIA_RE` accepts relative `assets/…` paths. **Do not tighten it to https-only** — that would
  reject every real media path on publish.
- Display ceiling 6rem/96px. No stacked uppercase kickers. `figure{margin:0}`.

## 8. Direction

Logged in `~/.claude/skills/design-router/references/used-log.md` **before** any code was written.
"Auction-house editorial" — bone paper, ink plates, gold demoted to hairline and small-caps.
**Bodoni Moda + Instrument Sans**, both outside the in-service font set. Light-mode dominant, which
makes this the portfolio's **second** light property after thirds.live — update that log before
choosing light again.

Gold and near-black were kept because the `3E` monogram is real brand equity (the Desert Hydra rule:
identity wins, differentiation moves to material, structure and motion). What was rejected is
gold-on-black *gradient* — the visual language of every budget exotic-rental site in Phoenix, which
makes Opul3nce less distinguishable, not more. It also fixes a literal problem: dark cars shot in
dark garages vanish on black and read instantly on bone.
