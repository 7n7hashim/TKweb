# Blu Real Estate rebrand — design record

**Date:** 2026-10-07
**Status:** built and verified; written as a record, not a gate (the user's preferred pace).

## Brief
"Adjust to blu real estate." The name matched firms in Cairo, New York and Vancouver; the user
identified the client as **@blurealestate.ke** on Instagram — a Mombasa property consultancy
("Buy | Sell | Rent") selling developers' off-plan apartments in Nyali, Kizingo and Stadium, with
one number (+254 740 777 888) and no website, no Google listing and no email.

## Decisions taken with the user
1. **All eight developments as listings** (over "3 featured + cards" and "sample listing only"):
   Blu's captions and price panels give real sizes, prices and payment plans, so every listing
   gets a page generated from one template, with its source post and date printed on it.
2. **Download Blu's images** (logo + listing slides) from Instagram's CDN, and **Montserrat** from
   Google Fonts — both with explicit permission.

## Decisions taken in the build
- **Structure:** an existing site template, with the agency side (buy / sell / rent). Sections: the hero; the build scrub, now "Buying off-plan"
  with Blu's 30/30/30/10 plan as its four stages; About (Buy / Sell / Rent); a listings
  carousel; Why Blu; services; facts; "Sell"; and the CTA.
- **Contact without email:** the contact form and the listing enquiry pop-up write the message
  out and open WhatsApp (`wa.me`). Nothing is sent until the visitor presses send there.
- **One data file → every page:** `scripts/site-data.mjs` + `scripts/build-pages.mjs` generate
  the listing pages and inject header, footer, cards and form options, so a price can't drift
  between card and page.
- **Names:** proper names only where Blu published them (Emaar Apartments; Wavecrest Residency).
  The other six use Blu's own headlines from its 6 June round-up.

## Brand
- **Palette** from the logo pixels: navy `#002865`, gold `#C59332`, plus a darker gold
  `#82601C` for text on light grounds, and cool "sea-mist" light grounds (not cream).
- **Type:** Montserrat set as the logo sets it: light words with heavy emphasis ("blu" /
  "real"). Inter for body text. 
- **Logo:** traced to SVG from the 1080 px logo post; shown on a navy plate hung from the
  header's top edge, because the lockup only reads on its own navy.
- **Signature — the spec strip:** Blu's flyer panel ("BOOK A HOME IN NYALI FOR | 3BR plus DSQ |
  2,850 square feet | KSH 16M") rebuilt as type. It appears on the hero (for the building
  pictured), under each listing hero, and on every listing card.
- **Honesty layer:** renders are always "artist's impression" (alt text, card tag, gallery
  caption, page notes). Crops exclude all flyer text, so no figure reaches the page as pixels.

## Verification (2026-10-07)
- `verify-pages.mjs`: ALL CLEAN on 11 pages; `check-contrast.mjs`: ALL PASS, exit 0.
- Brand guard: no files. Horizontal scroll: none at 360/390/768/1024/1440 on all 11 pages.
- Nav at 1024px: 78px clear on both sides. Both WhatsApp hand-offs and the `#area` filter were
  tested in Puppeteer. Motion mode (pinned scrubs) ran with no page errors.

## Open with the client
- Confirm the eight listing names, current prices and availability; resolve the two
  caption/flyer conflicts (PROVENANCE.md).
- Real photography of completed buildings would replace renders where it exists.
