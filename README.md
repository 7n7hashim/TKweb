# Real-estate website (universal demo)

A premium real-estate website for a fictional company, built to show property developers,
agencies, brokers and agents what their own site could look like. Static HTML, generated from one
data file, with no framework or backend: enquiries and viewing bookings hand off to WhatsApp.

## Pages
- `index.html` — home: hero, featured developments, featured properties,
  services, team, portfolio stats, owners & developers
- `properties.html` — every listing, with search by purpose, location, type and bedrooms
- `developments.html` — new developments with construction progress and availability
- `agents.html` — the team; `agent-*.html` — one profile per agent, with their listings (generated)
- `listing-*.html` — one page per property or development (generated): gallery, key facts,
  units and availability, floor plans, construction progress, payment plan, location, consultant
- `contact.html` — call, WhatsApp, email, offices, and an enquiry / viewing form

## Setting it up for a client
Everything lives in `scripts/site-data.mjs`: `BRAND` (name, logo, phone, WhatsApp, email,
offices, hours, social links), `THEME` (colours), `LOCATIONS`, `AGENTS`, `LISTINGS`.

```bash
node scripts/apply-theme.mjs          # only after changing THEME
node optimize-images.mjs              # only after changing photos
node scripts/build-pages.mjs
npx tailwindcss -i assets/tw-input.css -o assets/tailwind.css --minify
npx terser assets/site.js -c -m -o assets/site.min.js
```

## Running locally

```bash
PORT=3002 node serve.mjs
```

## Checks

```bash
PORT=3002 node verify-pages.mjs
node scripts/check-contrast.mjs
```

Photography: licensed Unsplash images (ids in `brand_assets/stock-source/sources.tsv`).
All company, listing and agent details are fictional.
