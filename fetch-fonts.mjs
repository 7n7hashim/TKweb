// Self-host Google Fonts: download the exact woff2 files Google serves (byte-identical
// rendering), keep only latin + latin-ext subsets, rewrite src to local paths, and emit
// assets/fonts.css. Removes the render-blocking third-party stylesheet and the two
// font-domain connections.
//
// Montserrat (display — Blu's logo and flyer face) and Inter (body) are both variable fonts:
// Google serves the SAME woff2 for every weight of a subset. Writing one @font-face per weight
// made pages download an identical file three times, so each subset gets ONE face with a weight
// range instead. (Keep the header comment free of the at-rule's name: an earlier script split
// this file on that string and left the comment unclosed, which disabled every face.)
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT_DIR = 'assets/fonts';
mkdirSync(OUT_DIR, { recursive: true });

const FAMILIES = [
  { css: 'Montserrat:wght@300;800', file: 'Montserrat', range: '300 800' },
  { css: 'Inter:wght@400;600', file: 'Inter', range: '400 600' },
];

// Chrome UA so Google returns woff2 (not ttf).
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const KEEP_SUBSETS = new Set(['latin', 'latin-ext']);

let out =
  '/* Montserrat (display) and Inter (body), self-hosted. Google serves each family as ONE variable\n' +
  '   woff2 per subset, identical for every weight, so each subset needs a single face with a weight\n' +
  "   range (Montserrat 300-800, Inter 400-600). Blu's logo and flyers are set in Montserrat. */\n";
let count = 0;

for (const fam of FAMILIES) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${fam.css}&display=swap`, { headers: { 'User-Agent': UA } })).text();
  const seen = new Set();
  const re = /\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const subset = m[1];
    let block = m[2];
    if (!KEEP_SUBSETS.has(subset) || seen.has(subset)) continue;
    seen.add(subset);
    const url = (block.match(/url\((https:\/\/[^)]+\.woff2)\)/) || [])[1];
    if (!url) continue;
    const fname = `${fam.file}-var-${subset}.woff2`;
    const buf = Buffer.from(await (await fetch(url, { headers: { 'User-Agent': UA } })).arrayBuffer());
    writeFileSync(`${OUT_DIR}/${fname}`, buf);
    block = block
      .replace(/url\(https:\/\/[^)]+\.woff2\)/, `url(fonts/${fname})`)
      .replace(/font-weight:\s*\d+;/, `font-weight: ${fam.range};`);
    out += block + '\n';
    count++;
    console.log(`${fname}  ${(buf.length / 1024).toFixed(1)}KB`);
  }
}

writeFileSync('assets/fonts.css', out);
console.log(`\nWrote assets/fonts.css with ${count} faces`);
