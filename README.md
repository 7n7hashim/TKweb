# Blu Real Estate

Website for **Blu Real Estate**, a property consultancy in Mombasa, Kenya: buy, sell or rent.
It lists eight off-plan developments in Nyali, Kizingo and Stadium, with the floor areas, prices
and payment plans Blu has published.

Contact: **+254 740 777 888** (call or WhatsApp) · Instagram [@blurealestate.ke](https://www.instagram.com/blurealestate.ke/)

## Pages
- `index.html` — home
- `properties.html` — all listings, filterable by area
- `listing-*.html` — one page per development (generated)
- `contact.html` — call, WhatsApp, or a form that opens WhatsApp

## Editing listings
All listing data lives in `scripts/site-data.mjs`. After editing it:

```bash
node scripts/build-pages.mjs
npx tailwindcss -i assets/tw-input.css -o assets/tailwind.css --minify
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

Images are developers' renders posted by Blu (artist's impressions); sources and the origin of
every figure are in `brand_assets/blu-source/PROVENANCE.md`. Deployed on Vercel from `main`.
