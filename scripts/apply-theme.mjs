/* Re-colours the whole site from THEME in scripts/site-data.mjs.
 *
 *   1. edit THEME (keep each role, change its value)
 *   2. node scripts/apply-theme.mjs
 *   3. node scripts/build-pages.mjs && npx tailwindcss -i assets/tw-input.css -o assets/tailwind.css --minify
 *      && npx terser assets/site.js -c -m -o assets/site.min.js
 *   4. update T in scripts/check-contrast.mjs and run it — a new palette must still clear AA
 *
 * Colours are written as literals across the inline <style> blocks, the stylesheets, the
 * Tailwind config, the SVG marks and site.js, so this rewrites each role's LAST APPLIED value
 * (scripts/theme-applied.json) to its new one, everywhere:
 *   • hex after `#` or `%23` (SVG data URIs spell colours URL-encoded), any case
 *   • rgba(r,g,b,…) triplets of the same colour, rewritten without spaces (Tailwind arbitrary
 *     values such as shadow-[0_20px_42px_-14px_rgba(0,27,69,0.6)] break on spaces)
 * One combined pass, so a value written by one role can never be rewritten again by another.
 * A few hover tints (e.g. #E3CF9F, #D2C29C) are not roles; check hovers after a big change.
 */
import { readFileSync, writeFileSync, globSync, existsSync } from 'node:fs';
import sharp from 'sharp';
import { THEME } from './site-data.mjs';

const APPLIED = 'scripts/theme-applied.json';
const before = existsSync(APPLIED) ? JSON.parse(readFileSync(APPLIED, 'utf8')) : { ...THEME };
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

const map = new Map();       // OLD HEX (upper) → new hex
const rgbMap = new Map();    // "r,g,b" → "r,g,b"
for (const [role, next] of Object.entries(THEME)) {
  const prev = before[role];
  if (!prev || prev.toUpperCase() === next.toUpperCase()) continue;
  if (map.has(prev.toUpperCase())) throw new Error(`two roles share ${prev}; give them distinct values first`);
  map.set(prev.toUpperCase(), next.toUpperCase());
  rgbMap.set(rgb(prev).join(','), rgb(next).join(','));
  console.log(`${role.padEnd(15)} ${prev} → ${next}`);
}
if (!map.size) { console.log('THEME matches the applied palette — nothing to do.'); process.exit(0); }

const FILES = [
  ...globSync('*.html'), ...globSync('assets/*.css').filter((f) => !f.endsWith('tailwind.css')),
  'assets/site.js', 'tailwind.config.js', 'scripts/build-pages.mjs', 'scripts/floor-plans.mjs',
  ...globSync('brand_assets/*.svg'),
];
const hexRe = new RegExp(`(#|%23)(${[...map.keys()].map((h) => h.slice(1)).join('|')})(?![0-9A-Fa-f])`, 'gi');
const rgbaRe = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(,|\))/g;

let total = 0;
for (const f of FILES) {
  const src = readFileSync(f, 'utf8');
  let n = 0;
  const out = src
    .replace(hexRe, (m, pre, hex) => { n++; return pre + map.get('#' + hex.toUpperCase()).slice(1); })
    .replace(rgbaRe, (m, r, g, b, end) => {
      const to = rgbMap.get(`${r},${g},${b}`);
      if (!to) return m;
      n++;
      return `${m.startsWith('rgba') ? 'rgba' : 'rgb'}(${to}${end}`;
    });
  if (n) { writeFileSync(f, out); console.log(`  ${f}: ${n}`); total += n; }
}

// the PNG favicons are rendered from the (now re-coloured) SVG
const svg = readFileSync('brand_assets/favicon.svg');
for (const [name, size] of [['favicon-32', 32], ['favicon-180', 180], ['favicon-512', 512], ['favicon', 64]]) {
  await sharp(svg, { density: 900 }).resize(size, size).png().toFile(`brand_assets/${name}.png`);
}
writeFileSync(APPLIED, JSON.stringify(THEME, null, 2) + '\n');
console.log(`\n${total} colour values rewritten. Next: build-pages, Tailwind, terser, then check-contrast (update its T first).`);
