# CLAUDE.md — Frontend Website Rules

> This repository is the **Blu Real Estate** website. `main` deploys to production on Vercel.

## Project: Blu Real Estate
- **Business:** a property consultancy (agency) in **Mombasa**. Their bio: *"Buy | Sell | Rent ·
  Real Estate Consultants"*. Everything they post is **off-plan apartments by other developers** in
  **Nyali, Kizingo and Stadium**, with prices, sizes and payment plans in the captions.
- **Public presence is social only:** Instagram **@blurealestate.ke** (10.9K followers), TikTok
  (5K), Threads (1K). **No website, no Google Maps listing, no email, no office address, no hours.**
  That is the sales argument — plus buyers' questions sitting unanswered under their posts.
- **One number:** **+254 740 777 888**, calls and WhatsApp (both sourced). WhatsApp is a sourced
  channel here, so the site uses it: every "contact" ends in a `wa.me/254740777888` link.
- Pages: `index.html` (anchors `#about`, `#why`, `#services`, `#overview`, `#sell`),
  `properties.html` (labelled **Listings**), `contact.html`, and **eight generated listing pages**
  `listing-<slug>.html`. Nav: Home · About · Listings · Services · Sell · Contact.

## The generator — edit data, not pages
- **`scripts/site-data.mjs`** holds all eight listings: figures, source post + date, images, alts.
- **`node scripts/build-pages.mjs`** writes every `listing-*.html` (they have no inline `<style>`;
  their CSS is `assets/listing-sections.css`) and injects the shared **header, footer, listing
  cards, hero spec strip and contact-form options** into index / properties / contact between
  `<!-- GEN:name -->` … `<!-- /GEN:name -->` markers. **Never hand-edit inside a GEN block** — it
  is overwritten. Hand-edit everything else on those three pages normally.
- Removing a listing from the data deletes its page on the next run.

## Real figures (sourced — never invent replacements)
Every fact, post and date is in `brand_assets/blu-source/PROVENANCE.md`. Rules:
- A figure appears only if Blu published it (caption or the price panel on its own slide).
  Where a caption and a flyer disagree, **the caption wins** (two cases, logged in PROVENANCE).
- Each listing page names its source post and date; the footer says prices are as published
  March–July 2026. Unpublished price or size → **"Ask Blu"**, never an estimate.
- **Names:** only two are Blu's own — **Emaar Apartments** (flyer) and **Wavecrest Residency**
  (TikTok + developer watermark). The other six use Blu's round-up headlines. Confirm all eight
  with the client before launch.
- Payment schedules are worded as each listing's own post words them (Skyline: "final instalment";
  Kizingo: "last 6 months"). Only the homepage explainer says "at handover" — that is the round-up.
- Not on the site, because Blu never published them: email, office address, hours, staff names,
  company history/registration, completion dates (except Seaside's posted groundbreaking month),
  service charges, "leading/best/#1".

## Imagery
- Every image is a **developer's render that Blu posted** — an artist's impression, mostly of
  unbuilt buildings. **Every `alt` says "Artist's impression … the developer's render, posted by
  Blu Real Estate"**, cards carry an "Artist's impression" tag, and no render is called a photo.
- Sources: `brand_assets/blu-source/` (35 files). **`optimize-images.mjs`** crops each one clear of
  Blu's flyer overlays (price panel, logo, phone), room labels and signage, into
  `brand_assets/optimized/<slug>-<w>.webp` (+ `.avif` for the hero). A crop rectangle that lets
  overlay text through would put an **unsourced price in pixels** — check new crops on a contact
  sheet. The Wavecrest renders keep the developer's faint watermark (not retouched).
- `brand_assets/build-frames/` (homepage scrub) is inherited **stock** construction footage,
  labelled as stock in its alt.

## Brand
- Palette sampled from **their logo** (`#002865` navy ground, `#C59332` gold mark):
  `forest #002865` (= logo navy) · `deep #001B45` · `darkest #00112B` · `ink #0B1A33` ·
  `sage #4F5B6E` (slate) · `gold #C59332` (**dark grounds / decorative only**, 2.67:1 on paper) ·
  `goldtext #82601C` (gold for text on light, 5.56:1) · `goldsoft #F7F0E1` · `limestone #EEF2F7`
  ("sea mist") · `paper #F9FBFD` · `line #DCE3EC` · `clay #9DBBE0` (dark only) /
  `claydeep #2C5791` / `claysoft #E9EFF7`. Light gold `#E2BE73` is dark-ground only.
  Token **names** are inherited; `forest`/`sage`/`clay` are misnomers (documented in
  `tailwind.config.js`). Decorative lines and bars use `#C59332`; **text on light uses `#82601C`**.
- **Contrast is enforced:** `node scripts/check-contrast.mjs` (token pairs, banned-colour scan with
  a reviewed dark-ground allowlist, and per-rule bg+text pairs). Exit code must be 0.
- **Type:** **Montserrat** (display; Blu's own face) + **Inter** (body), self-hosted, **one variable
  woff2 per subset** each (`assets/fonts.css`, regenerate with `fetch-fonts.mjs`). Display is set
  the way the logo is: **light (300) with heavy (800) emphasis** — any `<em>`/`<strong>`/`<b>`
  inside a heading or `.font-display` goes 800 and never italic (rule in `assets/tw-input.css`).
  Montserrat is much wider than the old serif — size headings down, and test at 360px.
- **Logo:** traced from their 1080 px logo post by `scripts/trace-logo.py` →
  `brand_assets/blu-logo.svg` (white + gold, for **navy grounds only**) and `blu-mark.svg`
  (house alone). In the header it sits on a navy **brand plate hung from the top edge**
  (`.brand-plate`), because the lockup is only legible on its own navy. Favicon: gold house on navy.
- **Signature: the spec strip.** Blu's flyers open "BOOK A HOME IN NYALI FOR | 3BR plus DSQ |
  2,850 square feet | KSH 16M". That panel, as type (`.spec`, in `assets/tw-input.css`), appears on
  the homepage hero, under every listing hero, and on every listing card. Keep it to those.

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session.

## Build steps — run after editing
- After editing `scripts/site-data.mjs` or the generator: `node scripts/build-pages.mjs`.
- **Tailwind is precompiled:** `npx tailwindcss -i assets/tw-input.css -o assets/tailwind.css --minify`
  (content = `./*.html`, so run it after the generator). Components in `@layer components` are purged
  unless a page uses them.
- **Opacity modifiers must be on Tailwind's scale** (`/5` steps) or bracketed (`/[0.62]`).
- Tailwind **arbitrary values cannot contain spaces**: `rgba(0,27,69,0.6)`, not `rgba(0, 27, 69, 0.6)`.
- **site.js is minified:** `npx terser assets/site.js -c -m -o assets/site.min.js`.
- **Bump `?v=` on changed asset refs.** Currently `?v=blu1` (in the three pages, and `V` in the
  generator for the listing pages).

## Local Server
- `PORT=3002 node serve.mjs`, or the `blu-site` config in `.claude/launch.json`.
  **Ports 3000 and 3001 belong to other projects.** Confirm the title before trusting a result:
  `curl -s http://127.0.0.1:3002/ | grep -o '<title>[^<]*</title>'` must print **Blu Real Estate**.

## Verification before claiming done
- `PORT=3002 node verify-pages.mjs` → **ALL CLEAN**, exit 0 (checks every `*.html` in the root,
  so new listings are covered automatically).
- `node scripts/check-contrast.mjs` exits 0. **Check the exit code directly, not after a pipe.**
- Leftover guard finds **no files** (`grep -l` exits 1 when clean — that is success):
  `grep -rilE 'unsplash|Instrument Serif|lorem ipsum|KSh |placeholder slot' ./*.html assets/*.css assets/*.js tailwind.config.js`
- Horizontal-scroll audit at 360 / 390 / 768 / 1024 / 1440px on every page.
- Desktop nav is `lg:flex` with `gap-7 xl:gap-12`: measured at 1024px, **78px** clear between the
  brand plate and the links and between the links and the WhatsApp button.
- Test both WhatsApp hand-offs (listing enquiry modal, contact form): they build a `wa.me` URL with
  the message written out. `window.open` must not get `'noopener'` as a feature (it returns null).

## Anti-Generic Guardrails
- **Colors:** never the default Tailwind palette — navy and gold from the logo only.
- **Shadows:** layered, navy-tinted, low opacity — never flat `shadow-md`; no gold-tinted shadows
  except a gold button's own glow.
- **Typography:** Montserrat display (light + heavy) + Inter body. Body line-height ~1.7.
- **Animations:** only `transform` and `opacity` (plus colour fades). Never `transition-all`.
- **Interactive states:** hover, focus-visible and active on every clickable element. On dark
  grounds the focus ring switches to `#C59332`.
- **Images:** gradient overlay + navy treatment layer.

## Hard Rules
- Do not invent prices, sizes, names, dates, amenities or locations — data comes from Blu's posts.
- Do not call a render a photograph; every image alt says "artist's impression".
- Do not let a crop include Blu's flyer text (prices, phone, logo) — the page copy carries figures.
- Do not publish an email, office address, hours or a person's name — Blu has published none.
- Do not hand-edit inside `<!-- GEN:… -->` blocks or the generated `listing-*.html` files.
- Do not use `transition-all`.
- Do not put `gold`, light gold or `clay` text on a light ground — use `goldtext`.
- Do not set display emphasis in italic — heavy weight only.
