/* Builds the Blu Real Estate site's repeated parts from scripts/site-data.mjs:
 *
 *   • writes one listing-<slug>.html per listing (the pages carry no inline <style>;
 *     everything they need is in assets/listing-sections.css)
 *   • injects the shared header, footer, listing cards and form options into index.html,
 *     properties.html and contact.html, between <!-- GEN:name --> … <!-- /GEN:name --> markers
 *
 * One data file, one template: a price can never say one thing on a card and another on the
 * listing it opens. Run after editing site-data.mjs:  node scripts/build-pages.mjs
 */
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { LISTINGS, AREAS, PHONE, PHONE_TEL, waLink, INSTAGRAM, TIKTOK, THREADS, count } from './site-data.mjs';

const V = 'blu1'; // cache-buster on every asset ref — bump when assets change

/* ---------- small helpers ---------- */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const imgPath = (slug, w) => `brand_assets/optimized/${slug}-${w}.webp`;
const srcset = (im) => im.widths.map((w) => `${imgPath(im.slug, w)} ${w}w`).join(', ');
const src = (im) => imgPath(im.slug, im.widths[Math.min(1, im.widths.length - 1)]);
const isTall = (im) => im.h > im.w * 1.25;
const areaLabel = (l) => AREAS[l.area].label;

const ICON = {
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-5.8-7-11a7 7 0 0 1 14 0c0 5.2-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  arrowUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4.1A8 8 0 1 1 20 11.5Z"/><path d="M9.2 9.3c.2 1.9 1.6 3.6 3.6 4.3l1-1 1.8.8-.4 1.6c-3 .2-6.2-2.6-6.4-5.7l1.5-.5.9 1.7-1 .8"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h3.5l1.7 4.3-2.2 1.5a11 11 0 0 0 6.2 6.2l1.5-2.2L20 15.5V19a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.2 2.4 2.4 4.6-4.8"/></svg>',
  layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="M2 14l10 5 10-5"/></svg>',
  tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.6 13.4 12.4 21.6a2 2 0 0 1-2.8 0L3 15V4h11l6.6 6.6a2 2 0 0 1 0 2.8Z"/><circle cx="8" cy="8" r="1.3"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14.5" rx="1.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.4"/></svg>',
  expand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4H4v5M15 4h5v5M15 20h5v-5M9 20H4v-5"/></svg>',
  prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>',
  instagram: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none"/></svg>',
  tiktok: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M14 3.5v11.2a3.8 3.8 0 1 1-3.8-3.8"/><path d="M14 3.5c.4 2.6 2.2 4.4 5 4.6"/></svg>',
  threads: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M16.8 11.2c-.6-3-2.6-4.3-5-4.2-2.8.1-4.7 2.2-4.7 5.1 0 3.4 2 5.6 5.1 5.6 2.5 0 4.6-1.6 4.6-3.8 0-2-1.6-3.1-3.9-3.1-1.9 0-3.1 1-3.1 2.3 0 1.2 1 2 2.4 2 2.2 0 3.5-1.9 3.5-5.4"/><path d="M19.5 12c0 4.6-3.2 8.5-7.6 8.5S4.5 16.8 4.5 12 7.6 3.5 12 3.5c3.4 0 5.9 1.7 7 4.6"/></svg>',
};

/* ---------- the flyer spec panel (the site's signature) ---------- */
export function spec(l, { variant = 'dark', compact = false, lead = true } = {}) {
  const s = l.spec;
  return `<div class="spec spec--${variant}${compact ? ' spec--compact' : ''}">` +
    (lead ? `<p class="spec-lead">Book a home in ${esc(areaLabel(l))} for</p>` : '') +
    `<div class="spec-cells">` +
      `<div class="spec-cell"><span class="spec-num">${esc(s.beds)}<small>BR</small></span><span class="spec-note">${s.dsq ? 'plus DSQ' : 'bedrooms'}</span></div>` +
      `<div class="spec-cell"><span class="spec-num">${esc(s.size)}</span><span class="spec-note">${esc(s.sizeNote)}</span></div>` +
      `<div class="spec-cell"><span class="spec-num"><span class="pre">KES</span>${esc(s.price)}<small>M</small></span><span class="spec-note">${esc(s.priceNote)}</span></div>` +
    `</div></div>`;
}

/* ---------- header ---------- */
const NAV = [
  ['index.html', 'Home', 'home'],
  ['index.html#about', 'About', 'about'],
  ['properties.html', 'Listings', 'listings'],
  ['index.html#services', 'Services', 'services'],
  ['index.html#sell', 'Sell', 'sell'],
  ['contact.html', 'Contact', 'contact'],
];
const WA_GENERAL = waLink('Hi Blu, I found you through your website. ');

export function header(current, variant = 'light') {
  const hero = variant === 'hero';
  const link = hero ? 'text-white/80 hover:text-white' : 'text-[#1A2E52]';
  const desk = NAV.map(([href, label, key]) =>
    `<a href="${href}"${key === current ? ' aria-current="page"' : ''} class="nav-link text-[13px] font-medium uppercase tracking-[0.08em] ${key === current ? (hero ? 'text-white' : 'text-forest') : link}">${label}</a>`).join('\n          ');
  const mob = NAV.map(([href, label, key]) =>
    `<a href="${href}"${key === current ? ' aria-current="page"' : ''} class="text-sm font-medium uppercase tracking-[0.08em] ${hero ? (key === current ? 'text-gold' : 'text-white/80') : (key === current ? 'text-forest' : 'text-ink/70')}">${label}</a>`).join('\n          ');
  return `<header class="${hero ? 'site-header--hero relative z-40' : 'relative z-40 border-b border-line bg-white'}">
      <div class="mx-auto flex h-24 max-w-[1400px] items-center justify-between px-6 lg:px-10">
        <a href="index.html" class="brand-plate"><img src="brand_assets/blu-logo.svg?v=${V}" width="775" height="564" alt="Blu Real Estate — home" /></a>
        <nav class="hidden items-center gap-7 lg:flex xl:gap-12" aria-label="Primary">
          ${desk}
        </nav>
        <a href="${WA_GENERAL}" target="_blank" rel="noopener" class="${hero ? 'btn-gold' : 'btn-navy'} hidden lg:inline-flex">${ICON.chat}WhatsApp Blu</a>
        <button id="nav-toggle" aria-expanded="false" aria-controls="nav-panel" class="inline-flex h-11 w-11 items-center justify-center ${hero ? 'text-white' : 'text-forest'} lg:hidden" aria-label="Open menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>
      </div>
      <div id="nav-panel" class="hidden ${hero ? 'border-t border-white/10 bg-deep/95' : 'border-t border-line bg-white'} px-6 pb-8 pt-4 lg:hidden">
        <nav class="flex flex-col gap-5" aria-label="Mobile">
          ${mob}
          <a href="${WA_GENERAL}" target="_blank" rel="noopener" class="${hero ? 'btn-gold' : 'btn-navy'} mt-2 w-fit">${ICON.chat}WhatsApp Blu</a>
        </nav>
      </div>
    </header>`;
}

/* ---------- footer ---------- */
export function footer() {
  const areas = Object.entries(AREAS).map(([key, a]) =>
    `<li><a href="properties.html#${key}" class="group flex items-baseline justify-between gap-4 text-white/75 transition-colors duration-300 hover:text-white"><span>${a.label}</span><span class="text-[12px] text-white/60 group-hover:text-gold">${count(key)} listing${count(key) === 1 ? '' : 's'}</span></a></li>`).join('\n            ');
  return `<footer class="bg-deep text-white">
    <div class="mx-auto max-w-[1280px] px-6 pb-10 pt-20 lg:px-10">
      <div class="grid gap-14 pb-16 lg:grid-cols-12 [&>div]:min-w-0">
        <div class="lg:col-span-4">
          <img src="brand_assets/blu-logo.svg?v=${V}" width="775" height="564" alt="Blu Real Estate" class="h-[88px] w-auto" loading="lazy" />
          <p class="mt-7 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">Buy <span class="mx-1.5 text-white/30">&middot;</span> Sell <span class="mx-1.5 text-white/30">&middot;</span> Rent</p>
          <p class="mt-5 max-w-sm text-sm leading-[1.8] text-white/60">Blu Real Estate is a property consultancy in Mombasa, Kenya, listing new homes in Nyali, Kizingo and Stadium.</p>
        </div>
        <div class="lg:col-span-2">
          <h3 class="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/60">Explore</h3>
          <ul class="mt-6 space-y-4 text-sm">
            ${NAV.map(([href, label]) => `<li><a href="${href}" class="text-white/75 transition-colors duration-300 hover:text-white">${label}</a></li>`).join('\n            ')}
          </ul>
        </div>
        <div class="lg:col-span-3">
          <h3 class="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/60">Where the listings are</h3>
          <ul class="mt-6 space-y-4 text-sm">
            ${areas}
          </ul>
          <p class="mt-6 text-[13px] leading-[1.7] text-white/60">Mombasa, Kenya</p>
        </div>
        <div class="lg:col-span-3">
          <h3 class="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/60">Call or WhatsApp</h3>
          <p class="mt-6 text-sm leading-[1.8]">
            <a href="tel:${PHONE_TEL}" class="block text-[19px] font-medium tracking-[0.01em] text-white transition-colors duration-300 hover:text-gold">${PHONE}</a>
            <a href="${WA_GENERAL}" target="_blank" rel="noopener" class="mt-2 inline-flex items-center gap-2 text-white/75 transition-colors duration-300 hover:text-white"><span class="h-4 w-4 text-gold">${ICON.chat}</span>Message on WhatsApp</a>
          </p>
          <div class="mt-7 flex flex-wrap gap-5" aria-label="Social media">
            <a href="${INSTAGRAM}" target="_blank" rel="noopener" class="text-white/60 transition-colors duration-300 hover:text-gold" aria-label="Blu Real Estate on Instagram">${ICON.instagram}</a>
            <a href="${TIKTOK}" target="_blank" rel="noopener" class="text-white/60 transition-colors duration-300 hover:text-gold" aria-label="Blu Real Estate on TikTok">${ICON.tiktok}</a>
            <a href="${THREADS}" target="_blank" rel="noopener" class="text-white/60 transition-colors duration-300 hover:text-gold" aria-label="Blu Real Estate on Threads">${ICON.threads}</a>
          </div>
        </div>
      </div>
      <div class="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-7 text-center text-xs text-white/60 sm:flex-row sm:text-left">
        <p>&copy; <span id="year">2026</span> Blu Real Estate. All rights reserved.</p>
        <p>Prices as Blu published them on Instagram, March&ndash;July 2026. Confirm before you pay.</p>
      </div>
    </div>
  </footer>`;
}

/* ---------- cards ---------- */
export function projCard(l, i) {
  const im = l.images.portrait;
  return `<a href="listing-${l.slug}.html" class="proj-card group" aria-label="${esc(l.name)}, ${esc(areaLabel(l))} — from ${esc(l.fromPrice)}">
            <div class="proj-media">
              <img class="proj-img" src="${src(im)}" srcset="${srcset(im)}" sizes="(min-width:1024px) 31vw, (min-width:640px) 48vw, 87vw" width="${im.w}" height="${im.h}" alt="${esc(im.alt)}" loading="lazy" decoding="async" />
              <div class="proj-tint" aria-hidden="true"></div>
              <div class="proj-scrim" aria-hidden="true"></div>
              <span class="proj-status" data-status="type">${esc(l.status)} &middot; ${esc(areaLabel(l))}</span>
              <div class="proj-caption">
                <h3 class="proj-name">${esc(l.name)}</h3>
                <p class="proj-loc">${ICON.pin}${esc(l.location)}</p>
                <p class="proj-price">From ${esc(l.fromPrice.replace(/^KES /, 'KES '))}</p>
              </div>
              <span class="proj-open" aria-hidden="true">${ICON.arrow}</span>
            </div>
          </a>`;
}

export function devCard(l, i) {
  const im = l.images.cover;
  return `<a href="listing-${l.slug}.html" class="dev-card" data-dev-card data-category="${l.area}" data-reveal style="--reveal-delay:${(i % 3) * 80}ms" aria-label="${esc(l.name)}, ${esc(l.location)} — from ${esc(l.fromPrice)}. Open the listing.">
          <div class="dev-media">
            <img class="dev-img${isTall(im) ? ' is-tall' : ''}" src="${src(im)}" srcset="${srcset(im)}" sizes="(min-width:1024px) 31vw, (min-width:640px) 46vw, 92vw" width="${im.w}" height="${im.h}" alt="${esc(im.alt)}" loading="lazy" decoding="async" />
            <span class="dev-render">Artist&rsquo;s impression</span>
          </div>
          <div class="dev-body">
            <div class="dev-top">
              <span class="dev-status" data-status="type"><i aria-hidden="true"></i>${esc(l.status)} &middot; ${esc(areaLabel(l))}</span>
              <span class="dev-open" aria-hidden="true">${ICON.arrowUp}</span>
            </div>
            <h2 class="dev-name">${esc(l.name)}</h2>
            <p class="dev-loc">${ICON.pin}${esc(l.location)}</p>
            <p class="dev-desc">${esc(l.intro)}</p>
            <div class="dev-divider" aria-hidden="true"></div>
            ${spec(l, { variant: 'light', compact: true, lead: false })}
            <span class="dev-explore">View the listing <span class="arrow" aria-hidden="true">&#10230;</span></span>
          </div>
        </a>`;
}

/* ---------- a listing page ---------- */
function gallery(l, start, label) {
  const g = l.images.gallery;
  const order = g.map((_, k) => g[(start + k) % g.length]);
  const slides = order.map((im, k) =>
    `<img class="res-slide${k === 0 ? ' is-active' : ''}${isTall(im) ? ' is-tall' : ''}"${k ? ' loading="lazy"' : ''} src="${src(im)}" srcset="${srcset(im)}" sizes="(min-width:1024px) 50vw, 100vw" width="${im.w}" height="${im.h}" alt="${esc(im.alt)}" />`).join('\n                ');
  const multi = order.length > 1;
  return `<div class="res-gallery" data-gallery>
            <div class="res-frame">
              <div class="res-slides">
                ${slides}
              </div>
              ${multi ? `<button type="button" class="res-arrow res-arrow-prev" data-gallery-prev aria-label="Previous image">${ICON.prev}</button>
              <button type="button" class="res-arrow res-arrow-next" data-gallery-next aria-label="Next image">${ICON.next}</button>` : ''}
              <button type="button" class="res-expand" data-gallery-full aria-label="View ${esc(label)} images full screen">${ICON.expand}</button>
              <span class="res-caption" aria-hidden="true">Artist&rsquo;s impression</span>
              ${multi ? '<div class="res-bar" data-gallery-bar aria-hidden="true"><span></span></div>' : ''}
            </div>
            <p class="sr-only" aria-live="polite" data-gallery-status>Image 1 of ${order.length}</p>
          </div>`;
}

function unitRow(l, u, k) {
  const dark = k % 2 === 1;
  const onReq = (v) => /^Ask/.test(v);
  const price = onReq(u.price)
    ? `<span class="res-amount is-onrequest">Ask Blu for the price</span>`
    : `<span class="res-amount">${esc(u.price)}</span>`;
  const size = onReq(u.size)
    ? `<span class="res-amount is-onrequest">Ask Blu</span>`
    : `<span class="res-amount">${esc(u.size)}${u.sizeAlt ? `<small>${esc(u.sizeAlt)}</small>` : ''}</span>`;
  return `<article class="res-row${dark ? ' is-dark' : ''}" data-reveal${k ? ` style="--reveal-delay:${Math.min(k, 3) * 60}ms"` : ''}>
          <div class="res-copy">
            <div class="res-badges">
              <span class="res-badge">${esc(l.status)}</span>${u.detail ? `<span class="res-badge res-badge-out">${esc(u.detail)}</span>` : ''}
            </div>
            <h3 class="res-name">${esc(u.name)}</h3>
            <div class="res-rule" aria-hidden="true"></div>
            <div class="res-figs">
              <p class="res-fig"><span class="res-from">Floor area</span>${size}</p>
              <p class="res-fig"><span class="res-from">Price</span>${price}</p>
            </div>
            <a href="contact.html" class="wel-cta res-cta" data-enquire-open data-development="${esc(l.name)}" data-residence="${esc(u.name)}">${ICON.chat}Ask about this home</a>
          </div>
          ${gallery(l, k, u.name)}
        </article>`;
}

function faq(l) {
  const hasDsq = l.units.some((u) => /DSQ/.test(u.name));
  const items = [
    ['Is it built yet?', l.status === 'Off-plan'
      ? `No. ${l.name} is being sold off-plan, before it is finished, which is why the pictures on this page are the developer&rsquo;s renders rather than photographs.${l.slug === 'seaside-elegance' ? ' Blu&rsquo;s post of 5 June 2026 gave February 2026 for groundbreaking.' : ''} Ask Blu for the current build stage and the handover date.`
      : `Blu&rsquo;s flyer lists it as for sale. Ask Blu about the build stage and when the apartments can be occupied.`],
    ['Are these prices current?', `They are the prices Blu published on Instagram on ${l.source.date}. Prices and availability change, so confirm the figure with Blu before you pay anything.`],
    ['Can I pay in instalments?', l.payment
      ? `Yes. ${l.payment.map(([p, a, w]) => `${p} ${w}`).join(', ')}. ${l.paymentNote || ''}`.replace(/\s+$/, '')
      : l.paymentText || `Blu did not publish a payment plan for this one, so ask. Its other off-plan listings mostly ask for 30% as a deposit, 30% within six months, 30% over the next six and 10% at handover.`],
    ...(hasDsq ? [['What is a DSQ?', 'Domestic staff quarters: a separate room, usually with its own bathroom, for a live-in housekeeper or nanny.']] : []),
    ['How do I book a site visit?', `Call or WhatsApp Blu on ${PHONE} and name the listing. Blu will arrange a time.`],
  ];
  return items.map(([q, a], i) => `<div class="faq-item${i === 0 ? ' is-open' : ''}" data-reveal style="--reveal-delay:${i * 45}ms">
            <button type="button" class="faq-q" data-faq-toggle aria-expanded="${i === 0}" aria-controls="faq-a-${i}" id="faq-q-${i}">
              <span>${q}</span>
              <span class="faq-icon" aria-hidden="true"></span>
            </button>
            <div class="faq-a" id="faq-a-${i}" role="region" aria-labelledby="faq-q-${i}" aria-hidden="${i !== 0}">
              <div class="faq-a-inner"><p>${a}</p></div>
            </div>
          </div>`).join('\n          ');
}

export function listingPage(l) {
  const hero = l.images.hero || l.images.cover;
  const tall = isTall(hero);
  const wa = waLink(`Hi Blu, I'm interested in ${l.name} (${areaLabel(l)}). `);
  const glance = [
    [ICON.pin, 'Location', l.location],
    [ICON.layers, 'Homes', l.units.map((u) => u.name).filter((v, i, a) => a.indexOf(v) === i).join(' · ')],
    [ICON.tag, 'Prices', l.fromPrice.startsWith('KES') ? `From ${l.fromPrice}` : l.fromPrice],
    [ICON.calendar, 'Payment plan', l.paymentSummary || (l.payment ? l.payment.map(([p]) => p).join(' · ') : 'Ask Blu')],
  ];
  const amen = l.amenities ? `
  <!-- ============ AMENITIES ============ -->
  <section id="amenities" class="bg-limestone">
    <div class="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-24">
      <header class="res-head" data-reveal>
        <p class="wel-eyebrow">Shared spaces</p>
        <h2 class="wel-title">What the building <span>has</span></h2>
        <p class="wel-lead">As Blu listed them for ${esc(l.name)}.</p>
      </header>
      <ul class="amen-grid" role="list">
        ${l.amenities.map((a, k) => `<li class="amen-item" data-reveal style="--reveal-delay:${(k % 3) * 60}ms">${ICON.check}<span>${esc(a)}</span></li>`).join('\n        ')}
      </ul>
    </div>
  </section>` : '';
  const pay = l.payment ? `
  <!-- ============ PAYMENT PLAN ============ -->
  <section id="payment" class="bg-deep text-white">
    <div class="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-24">
      <div data-reveal>
        <p class="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Paying for it</p>
        <h2 class="mt-5 max-w-2xl font-display text-[32px] leading-[1.08] tracking-[-0.03em] text-white sm:text-[44px]">${l.payment.length > 2
          ? `Pay as it rises, <em class="text-gold">in ${['', 'one', 'two', 'three', 'four', 'five'][l.payment.length]} stages.</em>`
          : `<em class="text-gold">${l.payment[0][0]} down,</em> the balance ${esc(l.payment[1][2])}.`}</h2>
      </div>
      <ol class="pay-steps" style="--steps:${l.payment.length}" data-reveal>
        ${l.payment.map(([p, a, w]) => `<li class="pay-step"><p class="pay-pct">${p}</p><p class="pay-label">${esc(a)}</p><p class="pay-when">${esc(w)}</p></li>`).join('\n        ')}
      </ol>
      ${l.paymentNote ? `<p class="pay-note" data-reveal>${esc(l.paymentNote)}</p>` : ''}
    </div>
  </section>` : '';
  const near = l.nearby ? `
  <!-- ============ NEARBY ============ -->
  <section id="nearby" class="bg-paper">
    <div class="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-24">
      <header class="res-head" data-reveal>
        <p class="wel-eyebrow">The area</p>
        <h2 class="wel-title">Close <span>by</span></h2>
      </header>
      <ul class="near-list" role="list">
        ${l.nearby.map((n, k) => `<li class="near-item" data-reveal style="--reveal-delay:${(k % 2) * 60}ms">${ICON.pin}<span>${esc(n)}</span></li>`).join('\n        ')}
      </ul>
      ${l.nearbyNote ? `<p class="near-note" data-reveal>${esc(l.nearbyNote)}</p>` : ''}
    </div>
  </section>` : '';

  return `<!doctype html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(l.name)}, ${esc(areaLabel(l))} — from ${esc(l.fromPrice)} | Blu Real Estate</title>
  <meta name="description" content="${esc(l.intro)} Listed by Blu Real Estate, Mombasa." />
  <!-- GENERATED by scripts/build-pages.mjs from scripts/site-data.mjs — edit the data, not this file. -->
  <link rel="icon" type="image/svg+xml" href="brand_assets/favicon.svg?v=${V}" />
  <link rel="icon" type="image/png" sizes="32x32" href="brand_assets/favicon-32.png?v=${V}" />
  <link rel="apple-touch-icon" href="brand_assets/favicon-180.png?v=${V}" />
  <meta name="theme-color" content="#001B45" />
  <link rel="preload" as="image" fetchpriority="high" imagesizes="${tall ? '(min-width:768px) 46vw, 100vw' : '100vw'}" imagesrcset="${srcset(hero)}" />
  <link rel="preload" as="font" type="font/woff2" href="assets/fonts/Montserrat-var-latin.woff2" crossorigin />
  <link rel="preload" as="font" type="font/woff2" href="assets/fonts/Inter-var-latin.woff2" crossorigin />
  <link rel="stylesheet" href="assets/fonts.css?v=${V}" />
  <link rel="stylesheet" href="assets/tailwind.css?v=${V}" />
  <link rel="stylesheet" href="assets/listing-sections.css?v=${V}" />
</head>
<body class="bg-paper font-sans text-ink">

  <!-- ============ NAV ============ -->
  ${header('listings', 'light')}

  <!-- ============ LISTING HERO ============ -->
  <section class="phero${tall ? ' phero--tall' : ''}">
    <img class="phero-img" src="${src(hero)}" srcset="${srcset(hero)}" sizes="${tall ? '(min-width:768px) 46vw, 100vw' : '100vw'}" width="${hero.w}" height="${hero.h}" alt="${esc(hero.alt)}" fetchpriority="high" />
    <div class="phero-grade" aria-hidden="true"></div>
    <div class="phero-inner">
      <nav class="phero-crumb" aria-label="Breadcrumb"><a href="properties.html">Listings</a> <span aria-hidden="true">/</span> <a href="properties.html#${l.area}">${esc(areaLabel(l))}</a></nav>
      <span class="phero-status"><i aria-hidden="true"></i>${l.status === 'For sale' ? 'For sale' : `${esc(l.status)} &middot; For sale`}</span>
      <h1 class="phero-name">${esc(l.name)}</h1>
      <p class="phero-loc">${ICON.pin}${esc(l.location)}</p>
    </div>
  </section>

  <!-- ============ SPEC BAND — the flyer panel ============ -->
  <section class="spec-band" aria-label="Key figures">
    <div class="spec-band-inner">
      ${spec(l, { variant: 'dark' })}
      <div class="spec-band-actions">
        <a href="${wa}" target="_blank" rel="noopener" class="btn-gold">${ICON.chat}WhatsApp about this</a>
        <a href="tel:${PHONE_TEL}" class="btn-ghost">${ICON.phone}${PHONE}</a>
      </div>
    </div>
  </section>

  <!-- ============ OVERVIEW ============ -->
  <section class="bg-limestone">
    <div class="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-24">
      <div class="welcome-grid">
        <div data-reveal>
          <p class="wel-eyebrow">${esc(areaLabel(l))} &middot; ${esc(l.status)}</p>
          <h2 class="wel-title">${esc(l.headline[0])} <span>${esc(l.headline[1])}</span></h2>
          <div class="wel-rule" aria-hidden="true"></div>
          <p class="wel-lead">${esc(l.intro)}</p>
          ${l.about.map((p) => `<p class="wel-lead">${esc(p)}</p>`).join('\n          ')}
          <div class="hl-tags">${l.highlights.map((h) => `<span class="hl-tag">${esc(h)}</span>`).join('')}</div>
          <a href="contact.html" class="wel-cta" data-enquire-open data-development="${esc(l.name)}">${ICON.chat}Ask about ${esc(l.name)}</a>
        </div>
        <aside data-reveal style="--reveal-delay:120ms">
          <div class="highlights">
            <h3 class="hl-title">At a <span>glance</span></h3>
            <ul class="hl-list">
              ${glance.map(([ico, k, v]) => `<li class="hl-item"><span class="hl-ico">${ico}</span><span class="hl-text"><span class="hl-label">${k}</span><span class="hl-value">${esc(v)}</span></span></li>`).join('\n              ')}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  </section>

  <!-- ============ HOMES ============ -->
  <section id="homes" class="bg-paper">
    <div class="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-24">
      <header class="res-head" data-reveal>
        <p class="wel-eyebrow">The homes</p>
        <h2 class="wel-title">${['', 'One', 'Two', 'Three', 'Four', 'Five'][l.units.length]} ${l.units.length === 1 ? 'plan' : 'plans'}, <span>as published</span></h2>
        <p class="wel-lead">Floor areas and prices as Blu published them on ${esc(l.source.date)}. Where Blu gave no figure, ask and it will tell you.</p>
      </header>
      <div class="res-rows">
        ${l.units.map((u, k) => unitRow(l, u, k)).join('\n        ')}
      </div>
    </div>
  </section>
${amen}${pay}${near}
  <!-- ============ FAQ ============ -->
  <section id="faq" class="bg-limestone">
    <div class="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-24">
      <div class="faq-wrap">
        <div class="faq-aside" data-reveal>
          <p class="wel-eyebrow">Good to know</p>
          <h2 class="wel-title">Before you <span>visit</span></h2>
          <div class="faq-help">
            <h3>Still have a question?</h3>
            <p>Send it on WhatsApp with the listing name, or call ${PHONE}.</p>
            <a href="${wa}" target="_blank" rel="noopener">Message Blu ${ICON.arrow}</a>
          </div>
        </div>
        <div class="faq-list" data-faq>
          ${faq(l)}
        </div>
      </div>
    </div>
  </section>

  <!-- ============ SOURCE ============ -->
  <section class="border-t border-line bg-paper">
    <div class="mx-auto max-w-[1280px] px-6 py-12 lg:px-10">
      <div class="src-note">
        ${ICON.info}
        <p>Every figure on this page is from Blu Real Estate&rsquo;s <a href="${l.source.url}" target="_blank" rel="noopener">Instagram post of ${esc(l.source.date)}</a>${l.source.also ? ` and its <a href="${l.source.also.url}" target="_blank" rel="noopener">post of ${esc(l.source.also.date)}</a>` : ''}. The images are the developer&rsquo;s renders that Blu posted: artist&rsquo;s impressions, not photographs. Prices and availability change, so confirm with Blu before you pay anything.</p>
      </div>
    </div>
  </section>

  <!-- ============ FOOTER ============ -->
  ${footer()}

  <script src="assets/site.min.js?v=${V}" defer></script>
</body>
</html>
`;
}

/* ---------- write everything ---------- */
const inject = (file, name, html) => {
  const s = readFileSync(file, 'utf8');
  const re = new RegExp(`(<!-- GEN:${name} -->)[\\s\\S]*?(<!-- /GEN:${name} -->)`);
  if (!re.test(s)) throw new Error(`${file}: no <!-- GEN:${name} --> marker`);
  writeFileSync(file, s.replace(re, `$1\n${html}\n$2`));
};

if (process.argv[1] && process.argv[1].endsWith('build-pages.mjs')) {
  // stale listing pages from a previous data set go first
  for (const f of readdirSync('.')) {
    if (/^listing-.*\.html$/.test(f) && !LISTINGS.some((l) => `listing-${l.slug}.html` === f)) { unlinkSync(f); console.log('removed', f); }
  }
  for (const l of LISTINGS) {
    writeFileSync(`listing-${l.slug}.html`, listingPage(l));
    console.log('wrote', `listing-${l.slug}.html`);
  }
  inject('index.html', 'header', header('home', 'hero'));
  inject('index.html', 'hero-spec', spec(LISTINGS.find((l) => l.slug === 'wavecrest-residency'), { variant: 'dark' }));
  inject('index.html', 'proj-cards', LISTINGS.map(projCard).join('\n\n          '));
  inject('index.html', 'footer', footer());
  inject('properties.html', 'header', header('listings', 'light'));
  inject('properties.html', 'dev-cards', LISTINGS.map(devCard).join('\n\n        '));
  inject('properties.html', 'footer', footer());
  inject('contact.html', 'header', header('contact', 'light'));
  inject('contact.html', 'listing-options', LISTINGS.map((l) => `<option>${esc(l.name)} (${esc(areaLabel(l))})</option>`).join('\n                  '));
  inject('contact.html', 'footer', footer());
  console.log('injected header, cards, options and footer into index, properties, contact');
}
