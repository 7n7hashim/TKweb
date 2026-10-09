// Image pipeline: crops each source photo to the shapes the site uses and writes responsive WebP
// variants (plus AVIF for the homepage hero), then a manifest the page generator reads for sizes.
//
// Sources: brand_assets/stock-source/*.jpg — licensed Unsplash photographs (free for commercial
// use; ids in stock-source/sources.tsv). They are DEMO imagery: when the site is set up for a real
// client, drop the client's own photos in that folder under the same names (or edit JOBS below)
// and re-run:  node optimize-images.mjs && node scripts/build-pages.mjs
//
// Shapes:  cover 3:2 (cards, listing heroes) · gallery 1080:920 (galleries) · portrait 4:5 (tall
// cards and editorial images) · hero 1920:866 (homepage). `fx`/`fy` place the crop (0–1 across the
// source), `zoom` < 1 crops tighter. Every crop is checked on a contact sheet for signage or text.
import sharp from 'sharp';
import { mkdirSync, statSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';

const SRC = 'brand_assets/stock-source';
const OUT = 'brand_assets/optimized';
mkdirSync(OUT, { recursive: true });

const WEBP = { quality: 78, effort: 5 };
const AVIF = { quality: 52, effort: 5 };

const SHAPES = {
  cover: { ratio: 3 / 2, widths: [640, 1080, 1600] },
  gallery: { ratio: 1080 / 920, widths: [640, 1080] },
  portrait: { ratio: 4 / 5, widths: [480, 800] },
  hero: { ratio: 1920 / 866, widths: [768, 1152, 1536, 1920], avif: true },
};

// [source, shape, { fx, fy, zoom }]  →  output slug: source (cover), source-g, source-p, source-hero
const C = (src, o = {}) => [src, 'cover', o];
const G = (src, o = {}) => [src, 'gallery', o];
const P = (src, o = {}) => [src, 'portrait', o];
const JOBS = [
  // Azure Residences — Nyali
  C('azure-tower', { fy: 0.3 }), P('azure-tower-p', { fy: 0.45 }), G('azure-living'), G('azure-pool'), G('azure-bedroom'), G('azure-kitchen', { fy: 0.55 }),
  // The Grand Heights — Westlands
  C('grand-tower'), P('grand-tower-p', { fy: 0.55 }), G('grand-living'), G('grand-kitchen'), G('grand-bedroom', { fy: 0.6 }),
  // Parkside Residences — Kilimani
  C('parkside-block', { fx: 0.55 }), P('parkside-p', { fy: 0.7 }), G('parkside-living'), G('parkside-kitchen'), G('parkside-bedroom'),
  // The Cove — Vipingo
  C('cove-aerial'), ['cove-aerial', 'hero', { fy: 0.55 }], P('cove-villa'), G('cove-pool'), G('cove-garden'), P('cove-garden', { fx: 0.45 }), G('cove-bedroom'),
  // Ocean House — Diani
  C('ocean-villa'), P('ocean-villa', { fx: 0.4 }), G('ocean-pool'), G('ocean-living'), G('ocean-bath'), G('ocean-view', { fy: 0.42 }),
  // Palm Court — Lavington
  C('palm-house'), P('palm-house', { fx: 0.62 }), G('palm-garden'), G('palm-living'), G('palm-bedroom'),
  // The Atrium — Upper Hill
  C('atrium-facade'), C('atrium-meeting'), P('atrium-tower-p', { fy: 0.6 }), G('atrium-hall'), G('atrium-floor'), G('atrium-meeting'),
  // Creekside land — Kilifi
  C('land-palms'), P('land-palms', { fx: 0.3 }), G('land-aerial'), G('land-forest'), G('land-palms'),
  // Riverside Penthouse — Westlands
  C('riverside-tower', { fy: 0.35 }), G('riverside-lounge', { fy: 0.6 }), G('riverside-dining'), G('riverside-bedroom'),
  // The Linden — Kilimani (crop stops above the estate sign, bottom left)
  C('linden-block', { fy: 0.35, zoom: 0.86 }), P('linden-living', { fx: 0.62 }), G('linden-living'), G('linden-kitchen'), G('linden-bedroom'),
  // Editorial uses
  C('azure-pool'), C('grand-living'),
];

const kb = (p) => (statSync(p).size / 1024).toFixed(0) + 'KB';
const suffix = { cover: '', gallery: '-g', portrait: '-p', hero: '-hero' };
const manifest = {};
const written = new Set();
let total = 0;

for (const [src, shape, { fx = 0.5, fy = 0.5, zoom = 1 }] of JOBS) {
  const file = `${SRC}/${src}.jpg`;
  const { width: W, height: H } = await sharp(file).metadata();
  const { ratio, widths, avif } = SHAPES[shape];
  let cw = Math.min(W, H * ratio) * zoom;
  let ch = cw / ratio;
  cw = Math.round(cw); ch = Math.round(ch);
  const left = Math.round(Math.min(Math.max(fx * W - cw / 2, 0), W - cw));
  const top = Math.round(Math.min(Math.max(fy * H - ch / 2, 0), H - ch));
  const slug = src.replace(/-p$/, '') + suffix[shape];
  const crop = sharp(file).extract({ left, top, width: cw, height: ch });
  const ws = widths.filter((w) => w <= cw);
  if (!ws.length) throw new Error(`${slug}: crop ${cw}px is narrower than every width`);
  for (const w of ws) {
    const base = crop.clone().resize({ width: w });
    const wp = `${OUT}/${slug}-${w}.webp`;
    await base.clone().webp(WEBP).toFile(wp);
    written.add(wp); total += statSync(wp).size;
    let line = `${slug}-${w}: webp ${kb(wp)}`;
    if (avif) {
      const a = `${OUT}/${slug}-${w}.avif`;
      await base.clone().avif(AVIF).toFile(a);
      written.add(a); total += statSync(a).size;
      line += `  avif ${kb(a)}`;
    }
    console.log(line);
  }
  const maxW = ws[ws.length - 1];
  manifest[slug] = { widths: ws, w: maxW, h: Math.round(maxW / ratio), avif: !!avif };
}

// stale outputs from an earlier set go
for (const f of readdirSync(OUT)) {
  const p = `${OUT}/${f}`;
  if (/\.(webp|avif)$/.test(f) && !written.has(p)) { unlinkSync(p); console.log('removed', p); }
}
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 1) + '\n');
console.log(`done — ${(total / 1048576).toFixed(1)}MB written, ${Object.keys(manifest).length} images in manifest.json`);
