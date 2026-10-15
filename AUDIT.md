# opul3nce.io — Complete Audit & Portfolio Framework Synthesis

**Audited 2026-09-06.** Every claim below was verified against the live site (curl + Chromium via
Playwright at 1440px and 390px) or against the local project record. Nothing here is from memory.

---

## PART 1 — What opul3nce.io actually is

### 1.1 Platform

| Fact | Value |
|---|---|
| Platform | **Webflow**, on a purchased **BRIX Templates** theme (class prefix `brix---`, asset names `…-elements-brix-templates.svg`) |
| Site id | `6531827f7dccba83837b263f` |
| Stylesheet | one shared 205 KB `opul3nce.webflow.shared.facffcf70.css` |
| Fonts | Google Fonts via `WebFont.load` — **Italiana** (display), **Montserrat** (UI), **Roboto** (body) |
| Copyright | **"Copyright © 2023 O"** — three years stale, and the brand name is truncated to a single letter |
| Pages live | 14 verified HTTP 200 |
| Forms | Webflow native, `method="get"`. `/contact` also embeds **Calendly** |
| Hero | `<video autoplay loop muted playsinline>` background with a poster |

### 1.2 The business (two businesses, actually)

**Opul3nce Luxury Concierge**, Scottsdale AZ. Johnathan Eden (CEO/founder), Danielle Fox (CMO,
co-founder), William Anthony (CFO), Calvin Alfaro (Creative Director).
Contact: `johnathan@opul3nce.io` · +1 (808) 276-8946 · IG `@opul3nce.io`.

It sells **two unrelated things from one site**:

1. **Luxury rental / concierge** — exotic cars, SUVs/sprinters, shuttles/coaches, limos/party buses,
   yachts, mansions, private jets, security, private chefs, event planning, travel planning.
2. **B2B business development** — website design, GoHighLevel CRM build-outs, merchant processing,
   media production, branding, paid ads (TikTok/Google/Meta), business credit & funding, social media
   management.

Inventory counted from the live pages: **~50 vehicles** (19 dated listings + ~14 nicknamed cars
— "Anomaly", "Nightwing", "The Dark Knight", "Chrome Hearts" — plus a supercar block of McLarens,
Lamborghini Urus/Huracán and Ferraris), **21 yachts**, **12 mansions** (all Miami), **~19 transport
vehicles**.

### 1.3 Strategic findings

**⚑ The testimonials are peer-to-peer car-sharing reviews, not concierge reviews.** Five of the nine
use the word *"host"* — "the best **host** I've ever worked with in Phoenix", "the **host** was very
nice and explained how to use the vehicle", "easy pickup and drop off thanks to the detailed
directions from the **host**". That is Turo's vocabulary, not a concierge's. The social proof is
real, but it proves *"a reliable Turo host"* while the page claims *"an ecosystem for the affluent."*
The proof and the positioning are selling two different companies.

**⚑ The hero photograph is Dubai, not Arizona.** The hero video/still is Dubai Marina — **"EMAAR"**
signage is legible on two towers in the frame. Directly below it the page says *"Exclusive Rentals in
Scottsdale… the stunning Arizona landscape… cruising along Camelback Mountain… the vibrant streets of
Old Town."* The single largest visual on the site contradicts the geography the whole business is
built on, and Scottsdale is the one thing they can't be commoditised on.

**⚑ Markets contradict themselves.** The `/partners` map pins **seven** markets — Scottsdale/PHX,
Vegas, LA, New York, New Jersey, Miami, Tampa. Every footer on all 14 pages lists **three** —
Scottsdale, Miami, LA. Both are presented as fact.

**⚑ Two incompatible logos on one screen.** The nav carries a gold Italiana wordmark with a `3E`
monogram; the hero carries a heavy white techno wordmark. They share no typeface, weight, colour, or
era, and they are visible simultaneously.

**No prices anywhere.** Not one vehicle, yacht, mansion or service has a rate, a deposit, a minimum,
or a "from $X". For a rental business, price is the qualifying question and the site refuses it.

**No specs either.** No seats, horsepower, mileage cap, insurance terms, delivery radius, minimum
age, or availability. Every card offers exactly one verb: "See More Photos".

### 1.4 Defects — measured, not guessed

| # | Defect | Evidence |
|---|---|---|
| 1 | **The primary CTA on the money page is a dead link.** `Request Rental` on `/exotic-cars` is `href="#"` | parsed from live HTML |
| 2 | **84 dead `href="#"` links sitewide** out of 445 anchors | 6 per page × 14 pages (Media Production, Event Planning, Asset Management, and all three Client-Services cities) + 24 vehicle-specific |
| 3 | **7 broken images on `/exotic-cars`** — the supercar block (`26`–`32.png`) never loads | `naturalWidth === 0` in Chromium |
| 4 | **38 `<h1>` on `/exotic-cars`, 47 on `/transportation`, 6 on `/`** — every card title is an H1 | DOM count |
| 5 | **No `<meta name="description">`, no canonical, no `og:title`/`og:image`** on the homepage | only `og:type` is present |
| 6 | **Wrong copy on 6 pages.** `/yachts`, `/mansions`, `/webdesign`, `/merchant-processing`, `/funding-business-credit`, `/about` all end with *"Check Rental Availability — Ready to hit the road?"* | live text |
| 7 | **4 page titles are bare CMS slugs** — `Partners`, `Transportation`, `Shuttles+Coaches`, `Sedans+Suvs+Sprinters`, `Limos+Party Busses`, `Funding & Business Credit` | `<title>` |
| 8 | **29 of 54 homepage images have empty or missing `alt`** | parsed |
| 9 | **Source images are multi-MB PNG photographs** — 92 unique image URLs totalling **52 MB** at full resolution; the largest single asset is **4.05 MB**, and one 2.4 MB asset is named `Screen Shot 2023-11-04` | `content-length` per URL. Webflow's `srcset` serves smaller `-p-500`/`-p-800` variants so *transferred* weight is lower — but PNG is the wrong container for photography either way |
| 10 | **Images served at 3–5× their display size** — the logo is a 1440px asset in a 300px slot; the hamburger is 460px in a 60px slot | `naturalWidth` vs `clientWidth` |
| 11 | **Desktop navigation is hidden behind a hamburger at 1440px.** Yachts, Mansions, Exotic Cars — every revenue page — is one click further away than it needs to be | screenshot |
| 12 | **Mobile pages are enormous** — `/partners` is **17,598 px** tall at 390px, `/exotic-cars` 14,004 px, `/` 10,967 px | `scrollHeight` |
| 13 | **`/partners` "Industry Success" cards sit at `opacity: 0`** after a full scroll — they are hover-reveal (`brix---team-text-wrapper`), so on touch devices the three category cards may never reveal | computed style after slow scroll |
| 14 | **Gold headings rely on `background-clip: text`** with a `#211f54` dark-indigo fallback colour. Where the clip fails or forced-colors is on, "Luxury" and "Scottsdale" render dark indigo on black — invisible | computed `color` on the spans |

Two things I expected to find and did **not**: there are **no console errors and no failed network
requests** on any page tested, and horizontal overflow is clean (`scrollWidth === clientWidth`) at
both 1440px and 390px. The build is not broken; it is untended and mis-aimed.

### 1.5 Visual read (from rendered screenshots, not from source)

- **Everything is dark cars, photographed in dark parking garages, on a black background.** The fleet
  grid has almost no tonal separation — a black G63 and a black Hummer against black concrete read as
  one shape. The two light vehicles (white BMW, blue Corvette) are the only cards that register.
- **The testimonial cards are pure white slabs on black.** Nine of them, unmodified, in a carousel.
  They are the brightest thing on the page and they are the least valuable content on it.
- **The icon system is two incompatible sets.** Travel + Event Services uses gold line-art on black
  circles (coherent). Business Development Services uses **multicoloured flat stock icons** — blue,
  red, purple, orange — on the same black circles. They are visibly from a different library.
- **The five hero value-props are gold 3D clip-art** — a star, a lightning bolt, a trophy, a key, a
  puzzle piece. Generic, and the row is clipped at the right edge.
- **Every service card wears a gold "foil ribbon" raster corner** — the BRIX template's decoration,
  not a brand asset.
- **Team titles are set in a small gold script** under each name, at a size where the script is
  guessed rather than read.
- `/exotic-cars` is ~50 identical cards, each capped by a full-width **white** "See More Photos" bar,
  producing a zebra ladder 11,434 px long with no filters, no sort, no price, no grouping.

---

## PART 2 — What the portfolio already knows

Ten shipped web properties, Jun–Aug 2026. The institutional knowledge lives in three places:
`~/EPK-Infrastructure-Project/EPK-Build-Context.md` (the consolidated brief),
`~/Documents/DesertHydra_EPK/HANDOFF.md` (the canonical spec), and
`~/.claude/skills/design-router/references/used-log.md` (the anti-repeat ledger).

### 2.1 The proven stack

```
index.html        one file: <style> design system + markup + render/motion JS. No build step.
content.json      the CMS. Single source of truth for every string, URL and media path.
admin/index.html  schema-driven editor; signs in via /api/auth, POSTs to /api/publish
api/auth.js       checks ADMIN_PASSWORD server-side, returns a 12h HMAC session token
api/_lib/auth.js  shared sign/verify — NOT routable (Vercel ignores _-prefixed)
api/publish.js    re-validates server-side, commits content.json to GitHub main
api/submit.js     nodemailer — because a mailto: button sends nothing
theme.js          font library + palette, shared by BOTH the site and the admin preview
epk.js            offscreen-video autoplay + [data-nav-toggle] mobile nav
package.json      engines.node = 22.x   ← Vercel defaults to 24 and the build fails
```

Rendering binds three ways: `data-c="path"` → `textContent`, `data-c-attr="path:attr"` → attributes,
and JS list renderers. `DEFAULT_CONTENT` is a byte-for-byte inline mirror of `content.json` so a
failed fetch degrades to real content, not placeholder text.

### 2.2 The rules that were learned by breaking something

Carried forward from `EPK-Build-Context.md` §5 — these are the ones that bear on this build:

- **Read the client's own brand assets before picking a direction.** Desert Hydra's riso/paper build
  shipped for a day and was thrown out: internally coherent, perfectly differentiated, and still
  wrong. *Differentiating from your portfolio is not the same as being right for the client.* Where
  identity and novelty conflict, **identity wins** and differentiation moves to material, motion and
  structure.
- **A `mailto:` submit button does not send anything.** A real client's submission vanished. Use
  `api/submit.js`. And a `200` is not proof of delivery.
- **Every `content.json` field needs an input in admin, or publishing wipes it.** LivvieP lost its X
  and YouTube URLs on a live user publish.
- **Verify the page actually renders a field before trusting the admin.** DrawFour had ~11 fields
  that were editable and completely inert.
- **`initMotion()` must await `DOMContentLoaded`.** A cached `content.json` beats the deferred GSAP
  CDN script and the whole scroll spine silently no-ops.
- **One `ScrollTrigger.refresh()` is not enough** — refresh on `load`, on iframe `load`, and via a
  debounced `ResizeObserver`.
- **A bare `<figure>` carries `margin: 1em 40px`** and silently halved every gallery tile on mobile.
- **Display type ceiling is 6rem / 96px.** **A stacked uppercase kicker above every section heading
  is a named anti-pattern** — open with a hairline rule and the heading.
- **Never gate video off by viewport width** — width picks a *smaller encode*.
- **Screenshot it and look.** Every real bug in the portfolio was invisible to assertions and obvious
  in a screenshot.
- **Never send a Claude Artifact link to a client** — deploy to Vercel and confirm with a logged-out
  `curl`.
- **The client's order is the spec**, and **don't fabricate or substitute media.**

### 2.3 The anti-repeat ledger

Burned: **Big Shoulders Display** (2 properties), **black + red/crimson** (3), **dark mode with a
single accent** (4 — "the default gravity of most installed systems and the easiest rut to fall back
into"). Fonts in service: Inter Tight, Oswald, Big Shoulders Display ×2, Unbounded, Inter + Pirata
One, Bebas Neue, Modern Thrash, Anybody, Archivo Expanded. **Under-used: light mode (1 of 10
properties), monochrome, serif.**

---

## PART 3 — The synthesis

The existing site's problem is not that it is ugly. It is that **it is a template wearing a costume**:
Dubai stock standing in for Scottsdale, Turo reviews standing in for concierge proof, gold clip-art
standing in for a brand, and "Request Rental" standing in for a booking system while pointing at `#`.

The portfolio's own hardest-won rule says identity wins over novelty. But Opul3nce's "identity" here
is **BRIX template defaults**, not a brand — its only genuine equity is the gold `3E` monogram and a
high-contrast serif wordmark. So the correct move is to keep **gold and near-black as the spine**
(that is real equity) and move all differentiation to **material, structure and motion** — which is
precisely the Desert Hydra resolution.

The direction that follows: **auction-house editorial**. Treat a $400/day G63 the way Phillips treats
a watch — bone paper, ink type, a real lot number, real specs, a real price, and the photograph given
room. Gold demoted from gradient-fill-and-glow to **hairline rules and small-caps** only. This is
light-mode-dominant, which is the portfolio's most under-used direction (1 of 10), and it solves the
literal legibility problem: dark cars are invisible on black and unmistakable on bone.

Full specification in `BUILD-PROMPT.md`.
