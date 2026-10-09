/* Builds the site's repeated parts from scripts/site-data.mjs:
 *
 *   • writes one listing-<slug>.html per listing (property or development) and one
 *     agent-<slug>.html per agent — these pages carry no inline <style>; their CSS is
 *     assets/components.css + assets/listing-sections.css
 *   • injects the shared head, header, footer, cards, search options, stats and contact details
 *     into the hand-written pages, between <!-- GEN:name --> … <!-- /GEN:name --> markers
 *   • points every wa.me / tel: / mailto: link on the hand-written pages at BRAND's details
 *
 * One data file, one template: a price can never say one thing on a card and another on the
 * listing it opens. Run after editing site-data.mjs:  node scripts/build-pages.mjs
 */
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import {
  BRAND, LOCATIONS, REGIONS, AGENTS, LISTINGS, DEVELOPMENTS, PROPERTIES, PAGES,
  waLink, emailDomain, agentOf, listingsOf, count,
} from './site-data.mjs';
import { planSvg } from './floor-plans.mjs';

const V = 'demo1'; // cache-buster on every asset ref — bump when assets change

/* ---------- small helpers ---------- */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MANIFEST = JSON.parse(readFileSync('brand_assets/optimized/manifest.json', 'utf8'));
const imgPath = (slug, w) => `brand_assets/optimized/${slug}-${w}.webp`;
const img = (l, name) => {
  const m = MANIFEST[name];
  if (!m) throw new Error(`${l ? l.slug : '?'}: image "${name}" is not in manifest.json — run optimize-images.mjs`);
  return { slug: name, widths: m.widths, w: m.w, h: m.h, avif: m.avif, alt: (l && l.alt && l.alt[name]) || (l ? l.name : '') };
};
const srcset = (im) => im.widths.map((w) => `${imgPath(im.slug, w)} ${w}w`).join(', ');
const src = (im, prefer = 1080) => imgPath(im.slug, im.widths.find((w) => w >= prefer) || im.widths[im.widths.length - 1]);
const locLabel = (l) => LOCATIONS[l.location].label;
const first = (name) => name.split(' ')[0];
const initials = (name) => name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('');
const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
const WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];

const isDev = (l) => l.kind === 'development';
const purposeKey = (l) => (isDev(l) ? 'development' : l.purpose);
const tone = (l) => (isDev(l) ? 'dev' : l.purpose === 'rent' ? 'rent' : 'sale');
const typeKey = (l) => {
  const t = l.type.toLowerCase();
  if (/office|commercial|retail|warehouse/.test(t)) return 'office';
  if (/land|plot/.test(t)) return 'land';
  if (/penthouse/.test(t)) return 'penthouse';
  if (/house|villa|townhouse/.test(t)) return 'house';
  return 'apartment';
};
export const TYPE_FILTERS = [['apartment', 'Apartments'], ['house', 'Houses & villas'], ['penthouse', 'Penthouses'], ['office', 'Offices & commercial'], ['land', 'Land']];
const maxBeds = (l) => Math.max(0, ...String(l.beds || '0').match(/\d+/g).map(Number));
const ctaWord = (l) => (isDev(l) ? 'development' : l.category === 'land' ? 'plot' : l.category === 'commercial' ? 'space' : 'property');
const leadText = (l) => `${isDev(l) ? 'New development' : l.purpose === 'rent' ? 'To let' : 'For sale'} in ${locLabel(l)}`;
const priceCell = (l) => [l.price.num, l.price.unit, l.price.note, l.price.pre || BRAND.currency];

const ICON = {
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-5.8-7-11a7 7 0 0 1 14 0c0 5.2-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  arrowUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>',
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4.1A8 8 0 1 1 20 11.5Z"/><path d="M9.2 9.3c.2 1.9 1.6 3.6 3.6 4.3l1-1 1.8.8-.4 1.6c-3 .2-6.2-2.6-6.4-5.7l1.5-.5.9 1.7-1 .8"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h3.5l1.7 4.3-2.2 1.5a11 11 0 0 0 6.2 6.2l1.5-2.2L20 15.5V19a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/><path d="m4 7 8 6 8-6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.2 2.4 2.4 4.6-4.8"/></svg>',
  layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 2 8l10 5 10-5-10-5Z"/><path d="M2 14l10 5 10-5"/></svg>',
  tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.6 13.4 12.4 21.6a2 2 0 0 1-2.8 0L3 15V4h11l6.6 6.6a2 2 0 0 1 0 2.8Z"/><circle cx="8" cy="8" r="1.3"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14.5" rx="1.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="15" r="4"/><path d="m11 12 8.5-8.5M16 7l2.5 2.5M14 9l2 2"/></svg>',
  crane: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 21V4h2v17M3 21h8M8 5h12l-3 3H8M17 8v5"/><rect x="15.5" y="13" width="3" height="3"/></svg>',
  area: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>',
  hash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4 7 20M17 4l-2 16M4.5 9h16M3.5 15h16"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.6v.4"/></svg>',
  expand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4H4v5M15 4h5v5M15 20h5v-5M9 20H4v-5"/></svg>',
  prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>',
  instagram: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none"/></svg>',
  facebook: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><path d="M14 8.5h2.5V5H14a3.5 3.5 0 0 0-3.5 3.5V11H8v3.5h2.5V21H14v-6.5h2.5L17 11h-3V9a.5.5 0 0 1 .5-.5Z"/></svg>',
  linkedin: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/><path d="M8 10.5V16M8 7.6v.3M11.5 16v-5.5M11.5 13c0-1.6 1-2.6 2.4-2.6s2.1 1 2.1 2.6V16"/></svg>',
};
const SOCIAL_LABEL = { instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn' };

/* ---------- brand lockup ---------- */
export function lockup(where = 'header') {
  if (BRAND.logo) {
    const [w, h] = BRAND.logoSize;
    return `<img src="${BRAND.logo}?v=${V}" width="${w}" height="${h}" alt="${esc(BRAND.name)}" class="brand-logo" />`;
  }
  return `<img src="${BRAND.mark}?v=${V}" width="40" height="40" alt="" class="brand-mark" />` +
    `<span class="brand-words"><span class="brand-name">${esc(BRAND.name)}</span><span class="brand-desc">${esc(BRAND.descriptor)}</span></span>`;
}

/* ---------- <head> for every page ---------- */
export function headMeta(title, description) {
  return `<title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:site_name" content="${esc(BRAND.name)}" />
  <meta name="whatsapp" content="${BRAND.whatsapp}" />
  <link rel="icon" type="image/svg+xml" href="brand_assets/favicon.svg?v=${V}" />
  <link rel="icon" type="image/png" sizes="32x32" href="brand_assets/favicon-32.png?v=${V}" />
  <link rel="apple-touch-icon" href="brand_assets/favicon-180.png?v=${V}" />
  <meta name="theme-color" content="#001B45" />`;
}

/* ---------- the spec strip (the site's signature) ----------
   cells: [number, unit, note, prefix?] — a flyer-style panel of three figures. */
export function spec(cells, { variant = 'dark', compact = false, lead = '' } = {}) {
  return `<div class="spec spec--${variant}${compact ? ' spec--compact' : ''}">` +
    (lead ? `<p class="spec-lead">${esc(lead)}</p>` : '') +
    `<div class="spec-cells">` +
    cells.map(([num, unit, note, pre]) =>
      `<div class="spec-cell"><span class="spec-num">${pre ? `<span class="pre">${esc(pre)}</span>` : ''}${esc(num)}${unit ? `<small>${esc(unit)}</small>` : ''}</span><span class="spec-note">${esc(note)}</span></div>`).join('') +
    `</div></div>`;
}
const bandCells = (l) => [...(l.spec || [l.facts[0], l.facts[2]]), priceCell(l)];

/* ---------- header ---------- */
const NAV = [
  ['index.html', 'Home', 'home'],
  ['properties.html', 'Properties', 'properties'],
  ['developments.html', 'Developments', 'developments'],
  ['agents.html', 'Agents', 'agents'],
  ['index.html#services', 'Services', 'services'],
  ['contact.html', 'Contact', 'contact'],
];
const VIEWING = 'contact.html?intent=viewing#enquire';

export function header(current, variant = 'light') {
  const hero = variant === 'hero';
  const link = hero ? 'text-white/80 hover:text-white' : 'text-[#1A2E52]';
  // the brand plate is the desktop link home; "Home" stays in the mobile panel and the footer
  const desk = NAV.filter(([, , key]) => key !== 'home').map(([href, label, key]) =>
    `<a href="${href}"${key === current ? ' aria-current="page"' : ''} class="nav-link text-[13px] font-medium uppercase tracking-[0.08em] ${key === current ? (hero ? 'text-white' : 'text-forest') : link}">${label}</a>`).join('\n          ');
  const mob = NAV.map(([href, label, key]) =>
    `<a href="${href}"${key === current ? ' aria-current="page"' : ''} class="text-sm font-medium uppercase tracking-[0.08em] ${hero ? (key === current ? 'text-gold' : 'text-white/80') : (key === current ? 'text-forest' : 'text-ink/70')}">${label}</a>`).join('\n          ');
  return `<header class="${hero ? 'site-header--hero relative z-40' : 'relative z-40 border-b border-line bg-white'}">
      <div class="mx-auto flex h-24 max-w-[1400px] items-center justify-between px-6 lg:px-10">
        <a href="index.html" class="brand-plate" aria-label="${esc(BRAND.name)} — home">${lockup()}</a>
        <nav class="hidden items-center gap-8 lg:flex xl:gap-10" aria-label="Primary">
          ${desk}
        </nav>
        <a href="${VIEWING}" class="${hero ? 'btn-gold' : 'btn-navy'} hidden xl:inline-flex">${ICON.calendar}Book a viewing</a>
        <button id="nav-toggle" aria-expanded="false" aria-controls="nav-panel" class="inline-flex h-11 w-11 items-center justify-center ${hero ? 'text-white' : 'text-forest'} lg:hidden" aria-label="Open menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>
      </div>
      <div id="nav-panel" class="hidden ${hero ? 'border-t border-white/10 bg-deep/95' : 'border-t border-line bg-white'} px-6 pb-8 pt-4 lg:hidden">
        <nav class="flex flex-col gap-5" aria-label="Mobile">
          ${mob}
          <a href="${VIEWING}" class="${hero ? 'btn-gold' : 'btn-navy'} mt-2 w-fit">${ICON.calendar}Book a viewing</a>
        </nav>
      </div>
    </header>`;
}

/* ---------- footer ---------- */
const WA_GENERAL = waLink('Hello, I found you through your website. ');
const socialLinks = (cls) => Object.entries(BRAND.social).filter(([, u]) => u).map(([k, u]) =>
  `<a href="${u}" target="_blank" rel="noopener" class="${cls}" aria-label="${esc(BRAND.name)} on ${SOCIAL_LABEL[k] || k}">${ICON[k] || ''}</a>`).join('\n            ');

export function footer() {
  const locs = Object.entries(REGIONS).map(([rk, rl]) => {
    const items = Object.entries(LOCATIONS).filter(([, a]) => a.region === rk).map(([key, a]) =>
      `<li><a href="properties.html?location=${key}" class="group flex items-baseline justify-between gap-4 text-white/75 transition-colors duration-300 hover:text-white"><span>${a.label}</span><span class="text-[12px] text-white/60 group-hover:text-gold">${count(key) || ''}</span></a></li>`).join('\n              ');
    return `<p class="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">${rl}</p>
            <ul class="mt-3 space-y-2.5 text-sm">
              ${items}
            </ul>`;
  }).join('\n            ');
  return `<footer class="bg-deep text-white">
    <div class="mx-auto max-w-[1280px] px-6 pb-10 pt-20 lg:px-10">
      <div class="grid gap-14 pb-16 sm:grid-cols-2 lg:grid-cols-12 [&>div]:min-w-0">
        <div class="sm:col-span-2 lg:col-span-4">
          <a href="index.html" class="brand-lockup brand-lockup--footer" aria-label="${esc(BRAND.name)} — home">${lockup('footer')}</a>
          <p class="mt-7 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">${BRAND.services.map(esc).join(' <span class="mx-1.5 text-white/30">&middot;</span> ')}</p>
          <p class="mt-5 max-w-sm text-sm leading-[1.8] text-white/60">${esc(BRAND.summary)}</p>
        </div>
        <div class="lg:col-span-2">
          <h3 class="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/60">Explore</h3>
          <ul class="mt-6 space-y-4 text-sm">
            ${NAV.map(([href, label]) => `<li><a href="${href}" class="text-white/75 transition-colors duration-300 hover:text-white">${label}</a></li>`).join('\n            ')}
          </ul>
        </div>
        <div class="lg:col-span-3">
          <h3 class="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/60">Locations</h3>
            ${locs}
        </div>
        <div class="lg:col-span-3">
          <h3 class="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/60">Get in touch</h3>
          <p class="mt-6 text-sm leading-[1.8]">
            <a href="tel:${BRAND.phoneTel}" class="block text-[19px] font-medium tracking-[0.01em] text-white transition-colors duration-300 hover:text-gold">${BRAND.phone}</a>
            <a href="${WA_GENERAL}" target="_blank" rel="noopener" class="mt-2 inline-flex items-center gap-2 text-white/75 transition-colors duration-300 hover:text-white"><span class="h-4 w-4 text-gold">${ICON.chat}</span>Message on WhatsApp</a>
            <a href="mailto:${BRAND.email}" class="mt-1 flex items-center gap-2 text-white/75 transition-colors duration-300 hover:text-white"><span class="h-4 w-4 text-gold">${ICON.mail}</span>${BRAND.email}</a>
          </p>
          <p class="mt-5 text-[13px] leading-[1.7] text-white/60">${BRAND.office.map(esc).join('<br />')}</p>
          <div class="mt-7 flex flex-wrap gap-5" aria-label="Social media">
            ${socialLinks('text-white/60 transition-colors duration-300 hover:text-gold')}
          </div>
        </div>
      </div>
      <div class="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-7 text-center text-xs text-white/60 sm:flex-row sm:text-left">
        <p>&copy; <span id="year">2026</span> ${esc(BRAND.name)}. All rights reserved.</p>
        <p>${esc(BRAND.disclaimer)}</p>
      </div>
    </div>
  </footer>`;
}

/* ---------- cards ---------- */
/* Featured developments: the tall image cards on the homepage's horizontal track. */
export function projCard(l) {
  const im = img(l, l.images.portrait || l.images.cover);
  return `<a href="listing-${l.slug}.html" class="proj-card group" aria-label="${esc(l.name)}, ${esc(locLabel(l))} — ${esc(l.price.label)}">
            <div class="proj-media">
              <img class="proj-img" src="${src(im, 800)}" srcset="${srcset(im)}" sizes="(min-width:1024px) 31vw, (min-width:640px) 48vw, 87vw" width="${im.w}" height="${im.h}" alt="${esc(im.alt)}" loading="lazy" decoding="async" />
              <div class="proj-tint" aria-hidden="true"></div>
              <div class="proj-scrim" aria-hidden="true"></div>
              <span class="proj-status" data-status="type">${esc(l.status)} &middot; ${esc(locLabel(l))}</span>
              <div class="proj-caption">
                <h3 class="proj-name">${esc(l.name)}</h3>
                <p class="proj-loc">${ICON.pin}${esc(l.address)}</p>
                <p class="proj-price">${esc(l.price.label)}</p>
              </div>
              <span class="proj-open" aria-hidden="true">${ICON.arrow}</span>
            </div>
          </a>`;
}

/* Every property and development: image, status, type, location, three figures, price. */
export function propCard(l, i = 0, { reveal = true } = {}) {
  const im = img(l, l.images.cover);
  return `<a href="listing-${l.slug}.html" class="dev-card" data-dev-card data-purpose="${purposeKey(l)}" data-location="${l.location}" data-type="${typeKey(l)}" data-beds="${maxBeds(l)}"${reveal ? ` data-reveal style="--reveal-delay:${(i % 3) * 80}ms"` : ''} aria-label="${esc(l.name)}, ${esc(l.type)} in ${esc(locLabel(l))} — ${esc(l.price.label)}. View the ${ctaWord(l)}.">
          <div class="dev-media">
            <img class="dev-img" src="${src(im, 640)}" srcset="${srcset(im)}" sizes="(min-width:1024px) 31vw, (min-width:640px) 46vw, 92vw" width="${im.w}" height="${im.h}" alt="${esc(im.alt)}" loading="lazy" decoding="async" />
            <span class="card-badge" data-tone="${tone(l)}">${esc(l.status)}</span>
          </div>
          <div class="dev-body">
            <div class="dev-top">
              <span class="dev-status"><i aria-hidden="true"></i>${esc(l.type)} &middot; ${esc(locLabel(l))}</span>
              <span class="dev-open" aria-hidden="true">${ICON.arrowUp}</span>
            </div>
            <h3 class="dev-name">${esc(l.name)}</h3>
            <p class="dev-loc">${ICON.pin}${esc(l.address)}</p>
            <div class="dev-divider" aria-hidden="true"></div>
            ${spec(l.facts, { variant: 'light', compact: true })}
            <div class="dev-foot">
              <p class="dev-price">${esc(l.price.label)}</p>
              <span class="dev-explore">View ${ctaWord(l)} <span class="arrow" aria-hidden="true">&#10230;</span></span>
            </div>
          </div>
        </a>`;
}

/* Developments page: one wide showcase row per development, with its build progress. */
export function devShowcase(l, i) {
  const im = img(l, l.images.cover);
  const avail = l.units.reduce((n, u) => n + u.available, 0);
  const total = l.units.reduce((n, u) => n + u.total, 0);
  const c = l.construction;
  return `<article class="show-row${i % 2 ? ' is-flipped' : ''}" data-reveal>
          <a href="listing-${l.slug}.html" class="show-media" tabindex="-1" aria-hidden="true">
            <img src="${src(im, 1080)}" srcset="${srcset(im)}" sizes="(min-width:1024px) 52vw, 100vw" width="${im.w}" height="${im.h}" alt="" loading="lazy" decoding="async" />
            <span class="card-badge" data-tone="dev">${esc(l.status)}</span>
          </a>
          <div class="show-body">
            <p class="show-eyebrow">${esc(l.type)} &middot; ${esc(locLabel(l))}</p>
            <h2 class="show-name"><a href="listing-${l.slug}.html">${esc(l.name)}</a></h2>
            <p class="show-loc">${ICON.pin}${esc(l.address)}</p>
            <p class="show-desc">${esc(l.intro)}</p>
            <div class="show-progress" role="img" aria-label="Construction ${c.percent}% complete">
              <div class="show-progress-top"><span>${esc(c.stage)}</span><b>${c.percent}%</b></div>
              <div class="cons-bar"><span style="--p:${c.percent}%"></span></div>
            </div>
            <dl class="show-facts">
              <div><dt>Prices</dt><dd>${esc(l.price.label)}</dd></div>
              <div><dt>Available</dt><dd>${avail} of ${total} homes</dd></div>
              <div><dt>Completion</dt><dd>${esc(c.completion)}</dd></div>
            </dl>
            <div class="show-actions">
              <a href="listing-${l.slug}.html" class="btn-navy">View development ${ICON.arrow}</a>
              <a href="contact.html?intent=development&amp;listing=${l.slug}#enquire" class="rule-link inline-flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-forest" data-enquire-open data-development="${esc(l.name)}">Register interest <span class="arrow" aria-hidden="true">&#10230;</span></a>
            </div>
          </div>
        </article>`;
}

/* Agent card (team grid, homepage). */
const portrait = (a, cls = 'agent-mono') => a.photo
  ? `<img class="${cls} ${cls}--photo" src="${a.photo}" width="400" height="400" alt="${esc(a.name)}" loading="lazy" />`
  : `<span class="${cls}" aria-hidden="true"><span>${esc(initials(a.name))}</span></span>`;

export function agentCard(a, i = 0) {
  const n = listingsOf(a).length;
  return `<a href="agent-${a.slug}.html" class="agent-card" data-reveal style="--reveal-delay:${(i % 4) * 70}ms" aria-label="${esc(a.name)}, ${esc(a.title)} — view profile and listings">
          ${portrait(a)}
          <div class="agent-body">
            <h3 class="agent-name">${esc(a.name)}</h3>
            <p class="agent-title">${esc(a.title)}</p>
            <p class="agent-focus">${a.focus.map(esc).join(' <span aria-hidden="true">|</span> ')}</p>
            <span class="agent-more">${plural(n, 'listing')} <span class="arrow" aria-hidden="true">&#10230;</span></span>
          </div>
        </a>`;
}

/* The consultant block on a listing page. */
function agentMini(a, l) {
  const wa = waLink(`Hello ${first(a.name)}, I'm interested in ${l.name} (${locLabel(l)}, ref ${l.ref}). `);
  return `<div class="agent-mini">
            <p class="agent-mini-label">Your consultant</p>
            <a href="agent-${a.slug}.html" class="agent-mini-who">
              ${portrait(a, 'agent-mono agent-mono--sm')}
              <span><span class="agent-mini-name">${esc(a.name)}</span><span class="agent-mini-title">${esc(a.title)}</span></span>
            </a>
            <div class="agent-mini-actions">
              <a href="${wa}" target="_blank" rel="noopener" aria-label="WhatsApp ${esc(a.name)}">${ICON.chat}WhatsApp</a>
              <a href="tel:${BRAND.phoneTel}" aria-label="Call ${esc(a.name)}">${ICON.phone}Call</a>
              <a href="mailto:${a.slug.split('-')[0]}@${emailDomain}" aria-label="Email ${esc(a.name)}">${ICON.mail}Email</a>
            </div>
          </div>`;
}

/* ---------- listing page parts ---------- */
function gallery(l, names, start, label, { caption = '' } = {}) {
  const order = names.map((_, k) => names[(start + k) % names.length]).map((n) => img(l, n));
  const slides = order.map((im, k) =>
    `<img class="res-slide${k === 0 ? ' is-active' : ''}"${k ? ' loading="lazy"' : ''} src="${src(im)}" srcset="${srcset(im)}" sizes="(min-width:1024px) 50vw, 100vw" width="${im.w}" height="${im.h}" alt="${esc(im.alt)}" />`).join('\n                ');
  const multi = order.length > 1;
  return `<div class="res-gallery" data-gallery>
            <div class="res-frame">
              <div class="res-slides">
                ${slides}
              </div>
              ${multi ? `<button type="button" class="res-arrow res-arrow-prev" data-gallery-prev aria-label="Previous image">${ICON.prev}</button>
              <button type="button" class="res-arrow res-arrow-next" data-gallery-next aria-label="Next image">${ICON.next}</button>` : ''}
              <button type="button" class="res-expand" data-gallery-full aria-label="View ${esc(label)} images full screen">${ICON.expand}</button>
              ${caption ? `<span class="res-caption" aria-hidden="true">${esc(caption)}</span>` : ''}
              ${multi ? '<div class="res-bar" data-gallery-bar aria-hidden="true"><span></span></div>' : ''}
            </div>
            <p class="sr-only" aria-live="polite" data-gallery-status>Image 1 of ${order.length}</p>
          </div>`;
}

function unitRow(l, u, k) {
  const dark = k % 2 === 1;
  const sold = u.available === 0;
  const bedsText = u.beds === 0 ? 'Studio' : plural(u.beds, 'bedroom');
  return `<article class="res-row${dark ? ' is-dark' : ''}" data-reveal${k ? ` style="--reveal-delay:${Math.min(k, 3) * 60}ms"` : ''}>
          <div class="res-copy">
            <div class="res-badges">
              <span class="res-badge${sold ? ' is-sold' : ''}">${sold ? 'Sold out' : `${u.available} of ${u.total} available`}</span>${u.detail ? `<span class="res-badge res-badge-out">${esc(u.detail)}</span>` : ''}
            </div>
            <h3 class="res-name">${esc(u.name)}</h3>
            <div class="res-rule" aria-hidden="true"></div>
            <div class="res-figs">
              <p class="res-fig"><span class="res-from">Layout</span><span class="res-amount res-amount--sm">${bedsText} &middot; ${plural(u.baths, 'bath')}</span></p>
              <p class="res-fig"><span class="res-from">Floor area</span><span class="res-amount">${esc(u.size)}${u.sizeAlt ? `<small>${esc(u.sizeAlt)}</small>` : ''}</span></p>
              <p class="res-fig"><span class="res-from">${sold ? 'Last price' : 'Price from'}</span><span class="res-amount">${esc(u.price)}</span></p>
            </div>
            <div class="res-ctas">
              <a href="contact.html?intent=development&amp;listing=${l.slug}#enquire" class="wel-cta res-cta" data-enquire-open data-development="${esc(l.name)}" data-residence="${esc(u.name)}">${ICON.chat}${sold ? 'Join the waiting list' : 'Ask about this home'}</a>
              ${u.plan ? `<a href="#plans" class="res-plan-link" data-plan-go="${u.plan}">Floor plan <span class="arrow" aria-hidden="true">&#10230;</span></a>` : ''}
            </div>
          </div>
          ${gallery(l, l.images.gallery, k, u.name)}
        </article>`;
}

function propertyRow(l) {
  const f = [
    ...(l.beds ? [['Bedrooms', l.beds], ['Bathrooms', l.baths]] : []),
    [l.category === 'land' ? 'Plot size' : 'Floor area', `${l.area} ${l.areaUnit}`],
    [l.purpose === 'rent' ? 'Rent' : 'Price', l.price.label],
  ];
  return `<article class="res-row" data-reveal>
          <div class="res-copy">
            <div class="res-badges">
              <span class="res-badge">${esc(l.status)}</span><span class="res-badge res-badge-out">Ref ${esc(l.ref)}</span>
            </div>
            <h3 class="res-name">${esc(l.type)} in ${esc(locLabel(l))}</h3>
            <div class="res-rule" aria-hidden="true"></div>
            <div class="res-figs res-figs--grid">
              ${f.map(([k, v]) => `<p class="res-fig"><span class="res-from">${k}</span><span class="res-amount res-amount--sm">${esc(v)}</span></p>`).join('\n              ')}
            </div>
            <div class="res-ctas">
              <a href="contact.html?intent=viewing&amp;listing=${l.slug}#enquire" class="wel-cta res-cta" data-enquire-open data-mode="viewing" data-development="${esc(l.name)}">${ICON.calendar}Book a viewing</a>
            </div>
          </div>
          ${gallery(l, l.images.gallery, 0, l.name)}
        </article>`;
}

function plansSection(l) {
  const plans = [];
  for (const u of l.units) {
    if (!u.plan) continue;
    const p = plans.find((x) => x.key === u.plan);
    if (p) p.units.push(u); else plans.push({ key: u.plan, units: [u] });
  }
  if (!plans.length) return '';
  const tabLabel = (p) => p.units.length > 1 ? `Typical layout, ${p.units[0].beds}–${p.units[p.units.length - 1].beds} bedrooms` : p.units[0].name;
  return `
  <!-- ============ FLOOR PLANS ============ -->
  <section id="plans" class="bg-limestone scroll-mt-24">
    <div class="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-24">
      <header class="res-head" data-reveal>
        <p class="wel-eyebrow">Floor plans</p>
        <h2 class="wel-title">${WORDS[plans.length] || plans.length} ${plans.length === 1 ? 'layout' : 'layouts'}, <span>room by room</span></h2>
        <p class="wel-lead">Illustrative layouts. Ask for the architect&rsquo;s plans with dimensions for the unit you are considering.</p>
      </header>
      <div class="plan-wrap" data-plans data-reveal>
        <div class="plan-tabs" role="tablist" aria-label="Floor plans">
          ${plans.map((p, k) => `<button type="button" role="tab" id="plan-tab-${p.key}" aria-controls="plan-${p.key}" aria-selected="${k === 0}" tabindex="${k === 0 ? 0 : -1}" class="plan-tab${k === 0 ? ' is-active' : ''}" data-plan-tab="${p.key}">${esc(tabLabel(p))}</button>`).join('\n          ')}
        </div>
        ${plans.map((p, k) => `<div class="plan-panel" role="tabpanel" id="plan-${p.key}" aria-labelledby="plan-tab-${p.key}"${k ? ' hidden' : ''}>
          <div class="plan-figure">${planSvg(p.key, p.units.map((u) => u.name).join(', '))}</div>
          <div class="plan-side">
            ${p.units.map((u) => `<div class="plan-unit"><h3>${esc(u.name)}</h3><p>${esc(u.size)}${u.sizeAlt ? ` &middot; ${esc(u.sizeAlt)}` : ''}</p><p class="plan-price">${esc(u.price)}</p></div>`).join('\n            ')}
            <a href="contact.html?intent=development&amp;listing=${l.slug}#enquire" class="wel-cta" data-enquire-open data-development="${esc(l.name)}" data-residence="${esc(p.units[0].name)}">${ICON.layers}Request full plans</a>
          </div>
        </div>`).join('\n        ')}
      </div>
    </div>
  </section>`;
}

function constructionSection(l) {
  const c = l.construction;
  return `
  <!-- ============ CONSTRUCTION ============ -->
  <section id="progress" class="bg-deep text-white">
    <div class="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-24">
      <div class="cons-grid">
        <div data-reveal>
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Construction progress</p>
          <h2 class="mt-5 max-w-xl font-display text-[32px] leading-[1.08] tracking-[-0.03em] text-white sm:text-[44px]"><strong class="text-gold">${c.percent}% complete,</strong> handover ${esc(c.completion)}.</h2>
          <p class="mt-6 max-w-md text-[15px] leading-[1.75] text-white/70">Current stage: ${esc(c.stage)}. Buyers receive a construction update with photographs every month.</p>
          <div class="cons-meter" role="img" aria-label="${c.percent}% complete">
            <div class="cons-bar cons-bar--dark"><span style="--p:${c.percent}%"></span></div>
            <div class="cons-scale" aria-hidden="true"><span>0</span><span>50</span><span>100%</span></div>
          </div>
        </div>
        <ol class="cons-steps" data-reveal style="--reveal-delay:120ms">
          ${c.milestones.map(([name, when, state]) => `<li class="cons-step${state ? ` is-${state}` : ''}"><span class="cons-dot" aria-hidden="true"></span><p class="cons-name">${esc(name)}</p><p class="cons-when">${esc(when)}${state === 'done' ? ' <span class="sr-only">(complete)</span>' : state === 'now' ? ' <span class="sr-only">(current stage)</span>' : ''}</p></li>`).join('\n          ')}
        </ol>
      </div>
    </div>
  </section>`;
}

function faq(l) {
  const a = agentOf(l);
  const items = isDev(l) ? [
    ['When will it be finished?', `${l.name} is ${l.construction.percent}% complete (${l.construction.stage.toLowerCase()}), with handover planned for ${l.construction.completion}. Buyers receive a progress report with photographs every month.`],
    ['Can I pay in instalments?', `Yes. ${l.payment.map(([p, , w]) => `${p} ${w}`).join(', ')}.${l.paymentNote ? ` ${l.paymentNote}` : ''}`],
    ['What does buying off-plan involve?', 'You reserve a specific unit, sign a sale agreement and pay in stages as the building rises. Your deposit is protected under the sale agreement, and the title is transferred at handover.'],
    ['Can I visit the site?', `Yes. Book a site visit and ${first(a.name)} will walk you through the site${l.construction.percent >= 80 ? ', the show apartment' : ''} and the available units.`],
    ['Can I buy from abroad?', 'Yes. Many buyers sign and pay remotely. We run video viewings and send documents for electronic signature.'],
  ] : l.purpose === 'rent' ? [
    ['What do I pay before moving in?', l.category === 'commercial' ? 'Typically a deposit of three months’ rent, the first quarter’s rent and service charge in advance, and stamp duty on the lease.' : 'Typically a deposit of two months’ rent plus the first month’s rent, paid when the lease is signed.'],
    ['How long is the lease?', `${l.tenure || 'Twelve months'}. Longer leases can be agreed with the landlord.`],
    ['Can I view it?', `Yes. Book a viewing and ${first(a.name)} will confirm a time, usually within a day.`],
    ['Who looks after repairs?', 'We manage the property for the landlord: report anything through your consultant and we arrange the repair.'],
  ] : [
    ['Is the price negotiable?', `Make an offer through ${first(a.name)}, who will put it to the owner in writing.`],
    ['What does buying involve?', 'An accepted offer, a sale agreement drawn up by the lawyers, a deposit (usually 10%), searches and consents, then the balance and the transfer of title.'],
    ['Can I view it?', `Yes. Book a viewing and ${first(a.name)} will confirm a time, usually within a day. Video viewings are available for buyers abroad.`],
    ['Can I get a mortgage on it?', l.category === 'land' ? 'Some banks lend against land with a clean freehold title; we can introduce you to lenders.' : 'Yes. We can introduce you to mortgage lenders and help you with what they need.'],
  ];
  return items.map(([q, ans], i) => `<div class="faq-item${i === 0 ? ' is-open' : ''}" data-reveal style="--reveal-delay:${i * 45}ms">
            <button type="button" class="faq-q" data-faq-toggle aria-expanded="${i === 0}" aria-controls="faq-a-${i}" id="faq-q-${i}">
              <span>${q}</span>
              <span class="faq-icon" aria-hidden="true"></span>
            </button>
            <div class="faq-a" id="faq-a-${i}" role="region" aria-labelledby="faq-q-${i}" aria-hidden="${i !== 0}">
              <div class="faq-a-inner"><p>${ans}</p></div>
            </div>
          </div>`).join('\n          ');
}

function pageShell({ title, description, preload = '', body, current }) {
  return `<!doctype html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${headMeta(title, description)}
  <!-- GENERATED by scripts/build-pages.mjs from scripts/site-data.mjs — edit the data, not this file. -->
  ${preload}
  <link rel="preload" as="font" type="font/woff2" href="assets/fonts/Montserrat-var-latin.woff2" crossorigin />
  <link rel="preload" as="font" type="font/woff2" href="assets/fonts/Inter-var-latin.woff2" crossorigin />
  <link rel="stylesheet" href="assets/fonts.css?v=${V}" />
  <link rel="stylesheet" href="assets/tailwind.css?v=${V}" />
  <link rel="stylesheet" href="assets/components.css?v=${V}" />
  <link rel="stylesheet" href="assets/listing-sections.css?v=${V}" />
</head>
<body class="bg-paper font-sans text-ink">

  <!-- ============ NAV ============ -->
  ${header(current, 'light')}
${body}
  <!-- ============ FOOTER ============ -->
  ${footer()}

  <script src="assets/site.min.js?v=${V}" defer></script>
</body>
</html>
`;
}

/* ---------- a listing page ---------- */
export function listingPage(l) {
  const dev = isDev(l);
  const hero = img(l, l.images.cover);
  const a = agentOf(l);
  const wa = waLink(`Hello, I'm interested in ${l.name} (${locLabel(l)}, ref ${l.ref}). `);
  const glance = dev ? [
    [ICON.pin, 'Location', l.address],
    [ICON.layers, 'Homes', l.units.map((u) => u.name).join(' · ')],
    [ICON.tag, 'Prices', l.price.label],
    [ICON.crane, 'Completion', `${l.construction.completion} · ${l.construction.percent}% built`],
    [ICON.calendar, 'Payment plan', l.payment.map(([p]) => p).join(' · ')],
  ] : [
    [ICON.home, 'Type', l.type],
    [ICON.pin, 'Location', l.address],
    [ICON.tag, l.purpose === 'rent' ? 'Rent' : 'Price', l.price.label],
    ...(l.tenure ? [[ICON.key, l.purpose === 'rent' ? 'Lease' : 'Tenure', l.tenure]] : []),
    ...(l.plot && l.category !== 'land' ? [[ICON.area, 'Plot', l.plot]] : []),
    [ICON.calendar, 'Availability', [l.year, l.furnished].filter(Boolean).join(' · ')],
    [ICON.hash, 'Reference', l.ref],
  ];
  const list = dev ? l.amenities : l.features;
  const amen = list ? `
  <!-- ============ ${dev ? 'AMENITIES' : 'FEATURES'} ============ -->
  <section id="amenities" class="${dev ? 'bg-paper' : 'bg-limestone'}">
    <div class="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-24">
      <header class="res-head" data-reveal>
        <p class="wel-eyebrow">${dev ? 'Shared spaces' : 'Features'}</p>
        <h2 class="wel-title">${dev ? 'What the development <span>has</span>' : `What the ${ctaWord(l)} <span>offers</span>`}</h2>
      </header>
      <ul class="amen-grid" role="list">
        ${list.map((x, k) => `<li class="amen-item" data-reveal style="--reveal-delay:${(k % 3) * 60}ms">${ICON.check}<span>${esc(x)}</span></li>`).join('\n        ')}
      </ul>
    </div>
  </section>` : '';
  const pay = dev && l.payment ? `
  <!-- ============ PAYMENT PLAN ============ -->
  <section id="payment" class="bg-limestone">
    <div class="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-24">
      <div data-reveal>
        <p class="wel-eyebrow">Payment plan</p>
        <h2 class="wel-title">${l.payment.length > 2 ? `Pay as it rises, <span>in ${WORDS[l.payment.length].toLowerCase()} stages</span>` : `<span>${l.payment[0][0]} down,</span> the balance ${esc(l.payment[1][2])}`}</h2>
      </div>
      <ol class="pay-steps pay-steps--light" style="--steps:${l.payment.length}" data-reveal>
        ${l.payment.map(([p, w, when]) => `<li class="pay-step"><p class="pay-pct">${p}</p><p class="pay-label">${esc(w)}</p><p class="pay-when">${esc(when)}</p></li>`).join('\n        ')}
      </ol>
      ${l.paymentNote ? `<p class="pay-note" data-reveal>${esc(l.paymentNote)}</p>` : ''}
    </div>
  </section>` : '';
  const near = l.nearby ? `
  <!-- ============ LOCATION ============ -->
  <section id="nearby" class="${dev ? 'bg-paper' : 'bg-paper'}">
    <div class="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-24">
      <header class="res-head" data-reveal>
        <p class="wel-eyebrow">Location &middot; ${esc(locLabel(l))}</p>
        <h2 class="wel-title">Close <span>by</span></h2>
        <p class="wel-lead">${esc(LOCATIONS[l.location].blurb)}</p>
      </header>
      <ul class="near-list" role="list">
        ${l.nearby.map((n, k) => `<li class="near-item" data-reveal style="--reveal-delay:${(k % 2) * 60}ms">${ICON.pin}<span>${esc(n)}</span></li>`).join('\n        ')}
      </ul>
    </div>
  </section>` : '';
  const others = LISTINGS.filter((x) => x.slug !== l.slug && (x.kind === l.kind || x.location === l.location)).slice(0, 3);
  const heroIm = l.images.hero ? img(l, l.images.hero) : hero;

  const body = `
  <!-- ============ LISTING HERO ============ -->
  <section class="phero">
    <img class="phero-img" src="${src(heroIm, 1600)}" srcset="${srcset(heroIm)}" sizes="100vw" width="${heroIm.w}" height="${heroIm.h}" alt="${esc(heroIm.alt)}" fetchpriority="high" />
    <div class="phero-grade" aria-hidden="true"></div>
    <div class="phero-inner">
      <nav class="phero-crumb" aria-label="Breadcrumb"><a href="${dev ? 'developments.html' : 'properties.html'}">${dev ? 'Developments' : 'Properties'}</a> <span aria-hidden="true">/</span> <a href="properties.html?location=${l.location}">${esc(locLabel(l))}</a></nav>
      <span class="phero-status"><i aria-hidden="true"></i>${esc(l.status)} &middot; ${esc(l.type)}</span>
      <h1 class="phero-name">${esc(l.name)}</h1>
      <p class="phero-loc">${ICON.pin}${esc(l.address)}</p>
    </div>
  </section>

  <!-- ============ SPEC BAND ============ -->
  <section class="spec-band" aria-label="Key figures">
    <div class="spec-band-inner">
      ${spec(bandCells(l), { variant: 'dark', lead: leadText(l) })}
      <div class="spec-band-actions">
        <a href="contact.html?intent=viewing&amp;listing=${l.slug}#enquire" class="btn-gold" data-enquire-open data-mode="viewing" data-development="${esc(l.name)}">${ICON.calendar}${dev ? 'Book a site visit' : 'Book a viewing'}</a>
        <a href="${wa}" target="_blank" rel="noopener" class="btn-ghost">${ICON.chat}WhatsApp</a>
      </div>
    </div>
  </section>

  <!-- ============ OVERVIEW ============ -->
  <section class="bg-limestone">
    <div class="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-24">
      <div class="welcome-grid">
        <div data-reveal>
          <p class="wel-eyebrow">${esc(locLabel(l))} &middot; ${esc(l.status)}</p>
          <h2 class="wel-title">${esc(l.headline[0])} <span>${esc(l.headline[1])}</span></h2>
          <div class="wel-rule" aria-hidden="true"></div>
          <p class="wel-lead">${esc(l.intro)}</p>
          ${l.about.map((p) => `<p class="wel-lead">${esc(p)}</p>`).join('\n          ')}
          <div class="hl-tags">${(l.highlights || l.features.slice(0, 3)).map((h) => `<span class="hl-tag">${esc(h)}</span>`).join('')}</div>
          <a href="contact.html?listing=${l.slug}#enquire" class="wel-cta" data-enquire-open data-development="${esc(l.name)}">${ICON.chat}Ask about ${esc(l.name)}</a>
        </div>
        <aside data-reveal style="--reveal-delay:120ms">
          <div class="highlights">
            <h3 class="hl-title">At a <span>glance</span></h3>
            <ul class="hl-list">
              ${glance.map(([ico, k, v]) => `<li class="hl-item"><span class="hl-ico">${ico}</span><span class="hl-text"><span class="hl-label">${k}</span><span class="hl-value">${esc(v)}</span></span></li>`).join('\n              ')}
            </ul>
          </div>
          ${agentMini(a, l)}
        </aside>
      </div>
    </div>
  </section>

  <!-- ============ ${dev ? 'AVAILABILITY' : 'GALLERY'} ============ -->
  <section id="homes" class="bg-paper">
    <div class="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-24">
      <header class="res-head" data-reveal>
        <p class="wel-eyebrow">${dev ? 'Availability' : 'The details'}</p>
        <h2 class="wel-title">${dev ? `${WORDS[l.units.length]} home ${l.units.length === 1 ? 'type' : 'types'}, <span>${l.units.reduce((n, u) => n + u.available, 0)} available</span>` : `Photographs <span>and key facts</span>`}</h2>
        <p class="wel-lead">${dev ? 'Availability is updated as units are reserved. Prices are the current list prices; ask for the price list for a specific floor.' : `Reference ${esc(l.ref)}. Book a viewing and ${esc(first(a.name))} will confirm a time.`}</p>
      </header>
      <div class="res-rows">
        ${dev ? l.units.map((u, k) => unitRow(l, u, k)).join('\n        ') : propertyRow(l)}
      </div>
    </div>
  </section>
${dev ? plansSection(l) + constructionSection(l) : ''}${amen}${pay}${near}
  <!-- ============ FAQ ============ -->
  <section id="faq" class="bg-limestone">
    <div class="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-24">
      <div class="faq-wrap">
        <div class="faq-aside" data-reveal>
          <p class="wel-eyebrow">Good to know</p>
          <h2 class="wel-title">Before you <span>${dev ? 'reserve' : l.purpose === 'rent' ? 'move in' : 'buy'}</span></h2>
          <div class="faq-help">
            <h3>Still have a question?</h3>
            <p>Send it on WhatsApp with the reference ${esc(l.ref)}, or call ${BRAND.phone}.</p>
            <a href="${wa}" target="_blank" rel="noopener">Message us ${ICON.arrow}</a>
          </div>
        </div>
        <div class="faq-list" data-faq>
          ${faq(l)}
        </div>
      </div>
    </div>
  </section>

  <!-- ============ MORE ============ -->
  <section class="border-t border-line bg-paper">
    <div class="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-24">
      <div class="more-head" data-reveal>
        <div>
          <p class="wel-eyebrow">Keep looking</p>
          <h2 class="wel-title">You may <span>also like</span></h2>
        </div>
        <a href="${dev ? 'developments.html' : 'properties.html'}" class="rule-link inline-flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-forest">All ${dev ? 'developments' : 'properties'} <span class="arrow" aria-hidden="true">&#10230;</span></a>
      </div>
      <div class="dev-grid mt-12">
        ${others.map((x, k) => propCard(x, k)).join('\n        ')}
      </div>
      <p class="ref-note">${ICON.info}<span>${esc(BRAND.disclaimer)} Reference ${esc(l.ref)}.</span></p>
    </div>
  </section>
`;
  return pageShell({
    title: `${l.name}, ${locLabel(l)} — ${l.price.label} | ${BRAND.name}`,
    description: `${l.intro} ${l.type} ${l.purpose === 'rent' ? 'to let' : 'for sale'} in ${locLabel(l)}, ${LOCATIONS[l.location].city}.`,
    preload: `<link rel="preload" as="image" fetchpriority="high" imagesizes="100vw" imagesrcset="${srcset(heroIm)}" />`,
    body,
    current: dev ? 'developments' : 'properties',
  });
}

/* ---------- an agent's page ---------- */
export function agentPage(a) {
  const mine = listingsOf(a);
  const wa = waLink(`Hello ${first(a.name)}, I found your profile on the ${BRAND.name} website. `);
  const body = `
  <!-- ============ PROFILE ============ -->
  <section class="agent-hero">
    <div class="mx-auto max-w-[1280px] px-6 py-16 lg:px-10 lg:py-24">
      <nav class="agent-crumb" aria-label="Breadcrumb"><a href="agents.html">Our team</a> <span aria-hidden="true">/</span> <span>${esc(a.name)}</span></nav>
      <div class="agent-hero-grid">
        <div class="agent-hero-portrait" data-reveal>${portrait(a, 'agent-mono agent-mono--lg')}</div>
        <div data-reveal style="--reveal-delay:100ms">
          <p class="wel-eyebrow">${esc(a.title)}</p>
          <h1 class="agent-hero-name">${esc(a.name.split(' ')[0])} <strong>${esc(a.name.split(' ').slice(1).join(' '))}</strong></h1>
          <p class="agent-hero-focus">${a.focus.map(esc).join(' <span aria-hidden="true">|</span> ')}</p>
          ${a.bio.map((p) => `<p class="agent-hero-bio">${esc(p)}</p>`).join('\n          ')}
          <dl class="agent-facts">
            <div><dt>Areas</dt><dd>${a.areas.map((k) => LOCATIONS[k].label).join(', ')}</dd></div>
            <div><dt>Languages</dt><dd>${a.languages.map(esc).join(', ')}</dd></div>
            <div><dt>Listings</dt><dd>${mine.length}</dd></div>
          </dl>
          <div class="agent-hero-actions">
            <a href="${wa}" target="_blank" rel="noopener" class="btn-navy">${ICON.chat}WhatsApp ${esc(first(a.name))}</a>
            <a href="tel:${BRAND.phoneTel}" class="agent-link">${ICON.phone}${BRAND.phone}</a>
            <a href="mailto:${a.slug.split('-')[0]}@${emailDomain}" class="agent-link">${ICON.mail}${a.slug.split('-')[0]}@${emailDomain}</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ============ LISTINGS ============ -->
  <section class="bg-limestone">
    <div class="mx-auto max-w-[1280px] px-6 py-20 lg:px-10 lg:py-24">
      <div class="more-head" data-reveal>
        <div>
          <p class="wel-eyebrow">Listed by ${esc(first(a.name))}</p>
          <h2 class="wel-title">${WORDS[mine.length] || mine.length} ${mine.length === 1 ? 'listing' : 'listings'} <span>right now</span></h2>
        </div>
        <a href="properties.html" class="rule-link inline-flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-forest">All properties <span class="arrow" aria-hidden="true">&#10230;</span></a>
      </div>
      <div class="dev-grid mt-12">
        ${mine.map((x, k) => propCard(x, k)).join('\n        ')}
      </div>
    </div>
  </section>

  <!-- ============ CTA ============ -->
  <section class="bg-deep">
    <div class="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-8 px-6 py-16 lg:flex-row lg:items-center lg:px-10" data-reveal>
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.3em] text-gold">Looking for something else?</p>
        <h2 class="mt-4 font-display text-[28px] leading-[1.12] tracking-[-0.035em] text-white lg:text-[36px]">Tell ${esc(first(a.name))} what you need, <strong class="text-gold">and your budget.</strong></h2>
      </div>
      <a href="${VIEWING}" class="btn-gold shrink-0">${ICON.calendar}Book a viewing</a>
    </div>
  </section>
`;
  return pageShell({
    title: `${a.name}, ${a.title} | ${BRAND.name}`,
    description: `${a.name} — ${a.title} at ${BRAND.name}. ${a.focus.join(', ')} in ${a.areas.map((k) => LOCATIONS[k].label).join(', ')}.`,
    body,
    current: 'agents',
  });
}

/* ---------- homepage stats (counted from the data) ---------- */
function stats() {
  const prices = LISTINGS.filter((l) => l.purpose === 'sale' && l.category === 'residential').map((l) => parseFloat(l.price.num));
  const cheapest = LISTINGS.find((l) => l.purpose === 'sale' && l.category === 'residential' && parseFloat(l.price.num) === Math.min(...prices));
  const card = (href, label, num, cap, icon, i, feature = false) => `<a href="${href}" class="stat-card${feature ? ' stat-card--feature' : ''}" data-reveal${i ? ` style="--reveal-delay:${i * 90}ms"` : ''}>
          <div class="stat-card-top">
            <span class="stat-label">${label}</span>
            <span class="stat-ico">${icon}</span>
          </div>
          <p class="stat-num">${num}</p>
          <p class="stat-cap">${cap}</p>
        </a>`;
  return [
    card('properties.html', 'Properties', PROPERTIES.length, 'Homes, land and offices for sale and to let', ICON.home, 0),
    card('developments.html', 'Developments', DEVELOPMENTS.length, `${DEVELOPMENTS.reduce((n, l) => n + l.units.reduce((m, u) => m + u.available, 0), 0)} new homes available`, ICON.crane, 1),
    card(`listing-${cheapest.slug}.html`, 'Homes from', `<small>${BRAND.currency}</small>${cheapest.price.num}${cheapest.price.unit}`, esc(`${cheapest.name}, ${locLabel(cheapest)}`), ICON.tag, 2),
    card('agents.html', 'Locations', Object.keys(LOCATIONS).length, `${AGENTS.length} consultants across ${Object.values(REGIONS).join(' and ').replace('The ', 'the ')}`, ICON.pin, 3, true),
  ].join('\n\n        ');
}

/* ---------- options for the search forms ---------- */
const locationOptions = () => Object.entries(REGIONS).map(([rk, rl]) =>
  `<optgroup label="${esc(rl)}">${Object.entries(LOCATIONS).filter(([, a]) => a.region === rk).map(([k, a]) => `<option value="${k}">${esc(a.label)}</option>`).join('')}</optgroup>`).join('\n                  ');
const typeOptions = () => TYPE_FILTERS.filter(([k]) => LISTINGS.some((l) => typeKey(l) === k)).map(([k, t]) => `<option value="${k}">${esc(t)}</option>`).join('\n                  ');

const locationCards = () => Object.entries(LOCATIONS).filter(([k]) => count(k)).map(([key, a], i) =>
  `<a href="properties.html?location=${key}" class="area-card" data-reveal style="--reveal-delay:${(i % 4) * 70}ms">
          <p class="area-num">${count(key)}</p>
          <p class="area-name">${esc(a.label)}</p>
          <p class="area-blurb">${esc(a.blurb)}</p>
          <span class="area-go">${a.city} &middot; view ${count(key) === 1 ? 'listing' : 'listings'} <span class="arrow" aria-hidden="true">&#10230;</span></span>
        </a>`).join('\n        ');

/* ---------- write everything ---------- */
const inject = (file, name, html) => {
  const s = readFileSync(file, 'utf8');
  const re = new RegExp(`(<!-- GEN:${name} -->)[\\s\\S]*?(<!-- /GEN:${name} -->)`, 'g');
  if (!re.test(s)) throw new Error(`${file}: no <!-- GEN:${name} --> marker`);
  writeFileSync(file, s.replace(re, (m, a, b) => `${a}${html}${b}`));
};
// inline blocks (brand name, phone, email) may appear many times and stay on one line
const injectInline = (file, name, text) => {
  const s = readFileSync(file, 'utf8');
  const re = new RegExp(`(<!-- GEN:${name} -->)[\\s\\S]*?(<!-- /GEN:${name} -->)`, 'g');
  writeFileSync(file, s.replace(re, (m, a, b) => `${a}${text}${b}`));
};
// every contact link on a hand-written page follows BRAND
const syncContacts = (file) => {
  const s = readFileSync(file, 'utf8')
    .replace(/https:\/\/wa\.me\/\d+/g, `https://wa.me/${BRAND.whatsapp}`)
    .replace(/tel:\+\d+/g, `tel:${BRAND.phoneTel}`)
    .replace(/mailto:[^"?]+/g, `mailto:${BRAND.email}`);
  writeFileSync(file, s);
};

if (process.argv[1] && process.argv[1].endsWith('build-pages.mjs')) {
  const want = new Set([...LISTINGS.map((l) => `listing-${l.slug}.html`), ...AGENTS.map((a) => `agent-${a.slug}.html`)]);
  for (const f of readdirSync('.')) {
    if (/^(listing|agent)-.*\.html$/.test(f) && !want.has(f)) { unlinkSync(f); console.log('removed', f); }
  }
  for (const l of LISTINGS) writeFileSync(`listing-${l.slug}.html`, listingPage(l));
  for (const a of AGENTS) writeFileSync(`agent-${a.slug}.html`, agentPage(a));
  console.log(`wrote ${LISTINGS.length} listing pages and ${AGENTS.length} agent pages`);

  const hero = LISTINGS.find((l) => l.images.hero) || DEVELOPMENTS[0];
  const pageKey = { 'index.html': 'home', 'properties.html': 'properties', 'developments.html': 'developments', 'agents.html': 'agents', 'contact.html': 'contact' };
  for (const [file, key] of Object.entries(pageKey)) {
    inject(file, 'head', '\n  ' + headMeta(PAGES[file].title, PAGES[file].description) + '\n  ');
    inject(file, 'header', '\n' + header(key, key === 'home' ? 'hero' : 'light') + '\n');
    inject(file, 'footer', '\n' + footer() + '\n');
    injectInline(file, 'brand-name', esc(BRAND.name));
    injectInline(file, 'phone', BRAND.phone);
    injectInline(file, 'email', BRAND.email);
    syncContacts(file);
  }
  inject('index.html', 'hero-caption', `\n          <p class="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">In the picture</p>
          <p class="mt-2 font-display text-[19px] font-bold tracking-[-0.02em] text-white sm:text-[22px]">${esc(hero.name)} <span class="font-light text-white/70">&middot; ${esc(locLabel(hero))}</span></p>\n        `);
  inject('index.html', 'hero-spec', '\n' + spec(bandCells(hero), { variant: 'dark' }) + '\n');
  inject('index.html', 'hero-link', `\n        <a href="listing-${hero.slug}.html" class="rule-link inline-flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-white">View the development <span class="arrow" aria-hidden="true">&#10230;</span></a>\n        `);
  inject('index.html', 'proj-cards', '\n' + DEVELOPMENTS.filter((l) => l.featured).map(projCard).join('\n\n          ') + '\n');
  inject('index.html', 'prop-cards', '\n' + PROPERTIES.filter((l) => l.featured).slice(0, 6).map((l, k) => propCard(l, k)).join('\n\n        ') + '\n');
  inject('index.html', 'agent-cards', '\n' + AGENTS.map(agentCard).join('\n\n        ') + '\n');
  inject('index.html', 'stats', '\n' + stats() + '\n');
  inject('properties.html', 'search-locations', '\n                  ' + locationOptions() + '\n                  ');
  inject('properties.html', 'search-types', '\n                  ' + typeOptions() + '\n                  ');
  inject('properties.html', 'dev-cards', '\n' + [...PROPERTIES, ...DEVELOPMENTS].map((l, k) => propCard(l, k)).join('\n\n        ') + '\n');
  injectInline('properties.html', 'listing-count', String(LISTINGS.length));
  inject('developments.html', 'dev-showcase', '\n' + DEVELOPMENTS.map(devShowcase).join('\n\n        ') + '\n');
  inject('agents.html', 'agent-cards', '\n' + AGENTS.map(agentCard).join('\n\n        ') + '\n');
  inject('contact.html', 'listing-options', '\n                  ' + LISTINGS.map((l) => `<option value="${l.slug}">${esc(l.name)} (${esc(locLabel(l))})</option>`).join('\n                  ') + '\n                  ');
  inject('contact.html', 'location-cards', '\n' + locationCards() + '\n');
  inject('contact.html', 'hours', BRAND.hours.map(esc).join('<br />'));
  inject('contact.html', 'office', BRAND.office.map(esc).join('<br />'));
  inject('contact.html', 'social', '\n            ' + socialLinks('inline-flex h-11 w-11 items-center justify-center rounded-xl border border-line text-sage transition-[transform,color,background-color,border-color] duration-300 hover:-translate-y-0.5 hover:border-goldtext hover:bg-goldtext/10 hover:text-goldtext active:translate-y-0') + '\n            ');
  console.log('injected head, header, footer, cards, search options, stats and contact details into the five hand-written pages');
}
