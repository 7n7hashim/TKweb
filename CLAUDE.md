# CLAUDE.md — Frontend Website Rules

> This branch (`universal-demo`) is a **universal premium real-estate website demo**: a finished-
> looking site for a fictional company, shown to developers, agencies, brokers and agents as
> "this could be your website". It is set up for a client by editing one data file.
> (`blu-main` holds the Blu Real Estate client site; don't mix the two.)

## What the demo is
- **Fictional company**, brand name currently the placeholder **"Your Company Name"** (the user's
  choice: they swap in each prospect's name before a pitch). Everything else reads as a real firm:
  no "template", "demo", "sample", "lorem ipsum" or "insert X here" anywhere in the UI.
- Serves **both developers and agents**: properties for sale/to let, new developments (units,
  availability, floor plans, construction progress, payment plans), land, commercial space,
  agent profiles with their listings, property search, viewing bookings, WhatsApp enquiries.
- Demo content: Kenya — Nairobi (Westlands, Kilimani, Lavington, Upper Hill) and the coast
  (Nyali, Vipingo, Kilifi, Diani), KES prices. **4 developments + 6 properties, 4 agents.**
- Phone/WhatsApp **+254 700 000 000** is a placeholder (user's choice). WhatsApp hand-offs to it
  won't reach anyone; swap in the client's number (or the user's own) for a live pitch.
- Pages: `index.html` (anchors `#about`, `#properties`, `#why`, `#services`, `#team`, `#overview`,
  `#sell`), `properties.html` (search), `developments.html`, `agents.html`, `contact.html`, plus
  generated `listing-<slug>.html` and `agent-<slug>.html`.
  Nav: Properties · Developments · Agents · Services · Contact on desktop (the brand plate links
  home; "Home" is in the mobile panel and footer); header CTA "Book a viewing" from `xl`.

## The generator — edit data, not pages
- **`scripts/site-data.mjs`** is the single place for: `BRAND` (name, descriptor, logo, mark,
  phone, WhatsApp, email, offices, hours, socials, disclaimer), `THEME` (colours), `LOCATIONS`,
  `AGENTS`, `LISTINGS` (kind `development` | `property`), and `PAGES` (titles/descriptions).
- **`node scripts/build-pages.mjs`** writes every `listing-*.html` and `agent-*.html` (no inline
  `<style>`; their CSS is `assets/components.css` + `assets/listing-sections.css`) and injects
  head meta, header, footer, cards, search options, stats, contact details and the brand name
  into the five hand-written pages between `<!-- GEN:name -->` … `<!-- /GEN:name -->` markers.
  It also rewrites every `wa.me/…`, `tel:` and `mailto:` link on those pages to BRAND's.
  **Never hand-edit inside a GEN block** or a generated page.
- Removing a listing or agent from the data deletes its page on the next run.
- Floor plans are schematic SVGs from `scripts/floor-plans.mjs` (keys: studio, 1br, 2br, 3br,
  4br, villa), labelled "illustrative" on the page. No per-room areas (they'd be invented precision).
- `site.js` reads the WhatsApp number from `<meta name="whatsapp">` (written by the generator).

## Branding — making it a client's site
- Name/contact/locations/team/listings: edit `site-data.mjs`, rebuild.
- Logo: set `BRAND.logo` to an SVG built for **dark grounds** (it sits on the navy brand plate and
  in the footer) and `BRAND.logoSize`; `null` = the built-in wordmark (`brand_assets/mark.svg` +
  the name in Montserrat). Favicons: `brand_assets/favicon.svg` (+ PNGs, re-rendered by apply-theme).
- Colours: edit `THEME`, run `node scripts/apply-theme.mjs` (rewrites hex, `%23` and rgba literals
  everywhere from `scripts/theme-applied.json`), rebuild, then update `T` in `check-contrast.mjs`.
- Photos: put the client's photos in `brand_assets/stock-source/` under the same names (or edit
  `JOBS` in `optimize-images.mjs`), run `node optimize-images.mjs` (writes webp/avif + 
  `brand_assets/optimized/manifest.json`, which the generator reads for sizes).

## Imagery
- Demo photos are **licensed Unsplash photographs** (free commercial licence), ids in
  `brand_assets/stock-source/sources.tsv`. Alts describe what the photo shows. No visible
  signage, brand names or people; check new crops on a contact sheet.
- `brand_assets/build-frames/` (homepage scrub) is stock construction footage, labelled stock.

## Design system
- Palette: `forest #002865` (primary navy) · `deep #001B45` · `darkest #00112B` · `ink #0B1A33` ·
  `sage #4F5B6E` · `gold #C59332` (**dark grounds / decorative only**, 2.67:1 on paper) ·
  `goldtext #82601C` (gold for text on light) · `goldsoft #F7F0E1` · `limestone #EEF2F7` ·
  `paper #F9FBFD` · `line #DCE3EC` · `clay #9DBBE0` (dark only) / `claydeep #2C5791` / `claysoft #E9EFF7`.
  Light gold `#E2BE73` is dark-ground only. Token names are inherited misnomers (see tailwind.config.js).
- **Contrast is enforced:** `node scripts/check-contrast.mjs` (token pairs, banned-colour scan with
  a reviewed dark-ground allowlist, per-rule bg+text pairs). Exit code must be 0.
- **Type:** Montserrat (display) + Inter (body), self-hosted, one variable woff2 per subset
  (`assets/fonts.css`, `fetch-fonts.mjs`). Display is light (300) with heavy (800) emphasis — any
  `<em>/<strong>/<b>` in a heading goes 800, never italic (rule in `assets/tw-input.css`).
- **Brand plate:** the lockup hangs on a navy plate from the top of the header (`.brand-plate`).
- **Signature: the spec strip** (`.spec`, in `assets/tw-input.css`): a lead line ("FOR SALE IN
  DIANI") over three figures — beds | area | price. On the homepage hero band, under every listing
  hero, and (compact, beds | baths | area) on every card. Keep it to those.
- Shared components (cards, search/filters, agent cards, developments showcase, page heroes, the
  enquiry modal) live in **`assets/components.css`**, plain CSS loaded by every page — not a
  Tailwind layer, because JS-added state classes would be purged.

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session.

## Build steps — run after editing
- After editing `scripts/site-data.mjs` or the generator: `node scripts/build-pages.mjs`.
- **Tailwind is precompiled:** `npx tailwindcss -i assets/tw-input.css -o assets/tailwind.css --minify`
  (content = `./*.html`, so run it after the generator).
- **Opacity modifiers must be on Tailwind's scale** (`/5` steps) or bracketed (`/[0.62]`).
- Tailwind **arbitrary values cannot contain spaces**: `rgba(0,27,69,0.6)`.
- **site.js is minified:** `npx terser assets/site.js -c -m -o assets/site.min.js`.
- **Bump `?v=` on changed asset refs.** Currently `?v=demo1` (in the five hand-written pages, and
  `V` in the generator).

## Local Server
- `PORT=3002 node serve.mjs`, or the `site` config in `.claude/launch.json`.
  **Ports 3000 and 3001 belong to other projects.** Confirm the title before trusting a result:
  `curl -s http://127.0.0.1:3002/ | grep -o '<title>[^<]*</title>'` must print the BRAND name.

## Verification before claiming done
- `PORT=3002 node verify-pages.mjs` → **ALL CLEAN**, exit 0 (checks every `*.html` in the root).
- `node scripts/check-contrast.mjs` exits 0. **Check the exit code directly, not after a pipe.**
- Leftover guard finds **no files** (`grep -l` exits 1 when clean — that is success):
  `grep -rilE 'blu real|blurealestate|740 777|Instrument Serif|lorem ipsum|KSh |placeholder slot|website template|demo property|sample property|insert property' ./*.html assets/*.css assets/*.js tailwind.config.js`
- Horizontal-scroll audit at 360 / 390 / 768 / 1024 / 1440px on every page.
- Desktop nav (`gap-8 xl:gap-10`): measured 131px clear of the brand plate at 1024 (no button
  below 1280), and 76px either side at 1280 with the button. A longer BRAND name widens the plate:
  re-measure after changing it.
- Test the WhatsApp hand-offs (listing enquiry, viewing booking with date/time, contact form with
  `?intent=&listing=` pre-fill): they build a `wa.me` URL with the message written out.
  `window.open` must not get `'noopener'` as a feature (it returns null).
- Test the properties search: purpose buttons, location/type/beds selects, URL params
  (e.g. `properties.html?location=nyali` from the footer), empty state and "Clear filters".

## Anti-Generic Guardrails
- **Colors:** never the default Tailwind palette — the THEME tokens only.
- **Shadows:** layered, navy-tinted, low opacity — never flat `shadow-md`; no gold-tinted shadows
  except a gold button's own glow.
- **Typography:** Montserrat display (light + heavy) + Inter body. Body line-height ~1.7.
- **Animations:** only `transform` and `opacity` (plus colour fades). Never `transition-all`.
- **Interactive states:** hover, focus-visible and active on every clickable element. On dark
  grounds the focus ring switches to `#C59332`.
- **Images:** gradient overlay + navy treatment layer.

## Hard Rules
- No "template", "demo", "sample", "example" or placeholder wording in the UI (the brand-name
  placeholder is the one deliberate exception, set by the user).
- No real company's name, logo, listing, render or contact details — everything is fictional.
- Do not hand-edit inside `<!-- GEN:… -->` blocks or the generated `listing-*` / `agent-*` pages.
- Do not use `transition-all`.
- Do not put `gold`, light gold or `clay` text on a light ground — use `goldtext`.
- Do not set display emphasis in italic — heavy weight only.
