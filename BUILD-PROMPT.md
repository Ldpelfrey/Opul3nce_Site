# BUILD PROMPT — opul3nce.io redesign

**Target:** a deployable flagship homepage for Opul3nce Luxury Concierge (Scottsdale, AZ) on the
proven portfolio stack, replacing a Webflow/BRIX template build.
**Read first:** `AUDIT.md` (this repo) and `~/EPK-Infrastructure-Project/EPK-Build-Context.md`.
**Assumption to state, not to hide:** this is built as a pitch-grade flagship page, not a 14-page
migration. The remaining pages inherit the same system; they are out of scope for this pass.

---

## 1. The brief

Opul3nce rents exotic cars, SUVs, sprinters, coaches, limos, yachts and mansions, and separately
sells B2B services (web, CRM, merchant processing, funding, media, ads). The current site is a
purchased template that hides its prices, points its main CTA at `#`, uses Dubai stock for a
Scottsdale business, and proves its credibility with Turo host reviews.

**The job is not a reskin.** It is to make the page answer the four questions the current one
refuses: *what is it, what does it cost, is it real, how do I book it.*

---

## 2. Direction — "Auction-house editorial"

Logged in `~/.claude/skills/design-router/references/used-log.md` before this prompt was run.

Treat the fleet as a **catalogue of lots**, not a gallery of cards. The reference is a Phillips watch
catalogue or a Sotheby's motorcar sale: bone paper, ink type, a lot number, real specifications, a
real price, and the photograph given room to be looked at.

**Why this and not another black-and-gold dark site:** the portfolio has shipped dark-with-one-accent
four times and that is the named rut. Light mode is 1 of 10 properties. Gold-on-black gradient is
also, specifically, the visual language of every budget exotic-rental site in Phoenix — leaning into
it makes Opul3nce *less* distinguishable, not more. And the literal problem on the live site is that
dark cars photographed in dark garages disappear on a black ground; on bone they are unmistakable.

**Identity is kept** per the Desert Hydra rule: gold and near-black remain the spine because the `3E`
monogram is real equity. Differentiation moves to material, structure and motion.

### Tokens

| Token | Value | Role |
|---|---|---|
| `--bone` | `#EDE9E2` | primary ground |
| `--bone-2` | `#E4DFD6` | alternating band |
| `--ink` | `#0E0E0D` | type, and the ground for full-bleed plates |
| `--ink-2` | `#1A1A18` | plate surface |
| `--leaf` | `#8A6D2F` | gold **on bone** — 5.1:1, safe for small text |
| `--leaf-lift` | `#C9A227` | gold **on ink** — 7.4:1, small text safe |
| `--rule` | `#0E0E0D` @ 18% | hairlines |
| `--muted` | `#5A564E` | secondary type on bone, 6.4:1 |

Two golds, measured, for the same reason Desert Hydra carries two reds: one gold cannot pass on both
grounds. **Verify by measuring rendered nodes in the browser, not by eyeballing tokens.**

### Type

**Bodoni Moda** (variable, high-contrast didone) for display + **Instrument Sans** for UI and body.
Neither is in the in-service set (Inter Tight, Oswald, Big Shoulders Display, Unbounded, Pirata One,
Bebas Neue, Modern Thrash, Anybody, Archivo Expanded). Bodoni honours the existing Italiana wordmark's
high-contrast-serif character while being far more rigorous.

- Display ceiling **6rem / 96px**. Do not raise the clamp.
- **No stacked uppercase kicker above section headings** — hairline rule, then the heading.
- Specs, prices and lot numbers set in Instrument Sans with tabular figures.
- Every `font-variation-settings` rule needs a matching `font-weight`.

### Material and motion

Gold appears **only** as: hairline rules, lot numbers, small-caps labels, and the monogram. No gold
gradients, no glows, no foil-ribbon rasters, no clip-art. The one permitted flourish is a 1px gold
rule that draws itself left-to-right as a section enters.

Motion is restrained: staggered rises on catalogue entries, a slow scale on plate photography, and
nothing that moves more than 24px. `prefers-reduced-motion` must **early-return and paint the final
state** — inline styles from a scroll handler beat the stylesheet.

---

## 3. Structure

1. **Hero.** Real Scottsdale/Sonoran imagery — **never Dubai**. If no licensed Arizona asset exists,
   ship a typographic hero on ink with the monogram and no photograph at all, and say in the handoff
   that the plate is awaiting a real shoot. Do not substitute more stock. One `<h1>`.
2. **Position bar.** Four facts, not adjectives: markets served, fleet count, delivery radius,
   response time. Any number that is not confirmed gets `[VERIFY]` in `content.json` and is omitted
   from the page — never invented.
3. **The Catalogue.** The core section. Each vehicle is a *lot*: gold lot number, name, year, a real
   photograph on bone, **a price**, and 4 specs (seats · drivetrain · daily mileage cap · delivery).
   Filterable by class. This is where the redesign earns its money.
4. **Beyond the fleet.** Yachts / mansions / jets / coaches as four editorial plates on ink.
5. **Proof.** Testimonials rebuilt as **quiet pull-quotes on bone with a hairline rule** — not white
   slabs. And label them honestly: if they are Turo host reviews, "Verified renter — Turo" is
   *stronger* than an unattributed five-star card, because it is checkable.
6. **The house.** Team, positioned as the concierge desk. One consistent portrait treatment.
7. **Business development.** A distinct, quieter band — visually separated so it stops diluting the
   rental pitch. Single icon system or none at all.
8. **Enquiry.** A real form posting to `/api/submit`, with vehicle, dates, and delivery address.
9. **Footer.** One market list that matches the map. Current year.

---

## 4. Non-negotiables (these are the audit findings)

- **One `<h1>` per page.** Card titles are `<h3>`.
- **Zero `href="#"`.** Every link resolves or the element is not a link.
- **Prices on every lot**, or an honest "Rate on request" — never silence.
- **`<meta name="description">`, canonical, `og:title`, `og:description`, `og:image`.**
- **Alt text on every image.** Descriptive, not the filename.
- **WebP**, sized to display, `loading="lazy"` below the fold. No 4 MB PNG photographs.
- **Visible desktop navigation.** Hamburger below 900px only.
- **Contact form posts to `api/submit.js`** — a `mailto:` sends nothing.
- **Markets stated once**, consistently, sourced from `content.json`.
- **Current copyright year**, computed.
- Honest empty states: a missing price shows "Rate on request", not a blank.

## 5. Stack (copy the proven one)

`index.html` · `content.json` · `theme.js` · `epk.js` · `admin/index.html` · `api/auth.js` ·
`api/_lib/auth.js` · `api/publish.js` · `api/submit.js` · `package.json` (`engines.node: 22.x`) ·
`vercel.json`.

- `DEFAULT_CONTENT` inline must **mirror `content.json` byte-for-byte**.
- Every `content.json` field needs an input in admin's `SECTIONS`, **or publishing wipes it**.
- Admin **mutates the loaded object and publishes it whole** — never rebuild from DOM.
- `initMotion()` **awaits `DOMContentLoaded`**; refresh triggers on `load` + `ResizeObserver`.
- Admin ids must be **selector-safe** — a literal dot makes `#f_a.b` parse as id + class.

## 6. Verification — before saying anything is done

1. `python3 -m http.server 8137` (not 8099 — Desert Hydra; not 8123 — JennBurg). Never `file://`.
2. Playwright at **390px and 1440px**: 0 console errors, 0 failed requests, no broken images,
   `scrollWidth === clientWidth`.
3. **Measure contrast on rendered nodes** and report the pass count.
4. **Screenshot both widths and actually look at them.** Assertions were green before every real bug
   this portfolio has had.
5. Report what is unverified or blocked rather than smoothing over it.

## 7. Out of scope — do not invent

Prices, fleet counts, response times, market lists, insurance terms and mileage caps are **business
facts nobody has supplied**. Use `[VERIFY]` markers in `content.json` and render an honest fallback.
A fabricated rate card is worse than a blank one. Do not substitute stock imagery for the Arizona
plates. Do not name Turo as a partner — describe the reviews accurately as verified renter reviews
only if Johnathan confirms their origin.
