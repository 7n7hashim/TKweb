/* Measures every text-bearing token pair against the AA 4.5:1 floor, and scans the real files
   for a decorative colour being used as text on an unreviewed ground.
   Exits non-zero on any failure so it can gate a commit.

   Blu Real Estate palette — see tailwind.config.js. `forest`, `sage` and the `clay` family are
   inherited token NAMES now carrying Blu navy, slate and sea blue; `gold` is the logo's gold. */
import { readFileSync, globSync } from 'node:fs';

const T = {
  forest: '#002865', deep: '#001B45', darkest: '#00112B', ink: '#0B1A33',
  sage: '#4F5B6E', paper: '#F9FBFD', limestone: '#EEF2F7', goldsoft: '#F7F0E1',
  claysoft: '#E9EFF7', line: '#DCE3EC',
  gold: '#C59332', goldtext: '#82601C', goldHover: '#D4A54A', lightGold: '#E2BE73',
  clay: '#9DBBE0', claydeep: '#2C5791',
  navLink: '#1A2E52', eyebrow: '#4B586C', goldDeepHover: '#664913',
  buildCap: '#24395E', cardMeta: '#1C2B45', hint: '#5E6A7C', readonlyBg: '#EAF0F8',
  white: '#FFFFFF', greyDecorative: '#A3ABB8',
};
const lum = (h) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/* [foreground, background, minimum] — every ground a colour is actually used on. */
const LIGHT = ['paper', 'limestone', 'claysoft', 'goldsoft', 'white'];
const PAIRS = [
  ...LIGHT.flatMap((bg) => [['ink', bg, 4.5], ['sage', bg, 4.5], ['goldtext', bg, 4.5],
                            ['forest', bg, 4.5], ['navLink', bg, 4.5], ['eyebrow', bg, 4.5],
                            ['claydeep', bg, 4.5], ['hint', bg, 4.5]]),
  /* light text on the dark grounds */
  ['paper', 'forest', 4.5], ['paper', 'deep', 4.5], ['paper', 'darkest', 4.5],
  ['white', 'forest', 4.5], ['white', 'deep', 4.5], ['white', 'goldtext', 4.5],
  ['white', 'goldDeepHover', 4.5],
  /* gold, light gold and clay are legal ON a dark ground */
  ['gold', 'forest', 4.5], ['gold', 'deep', 4.5], ['gold', 'darkest', 4.5],
  ['lightGold', 'forest', 4.5], ['lightGold', 'deep', 4.5], ['lightGold', 'darkest', 4.5],
  ['clay', 'deep', 4.5], ['clay', 'forest', 4.5],
  /* dark text on the gold grounds — every gold button and its hover state */
  ['ink', 'gold', 4.5], ['deep', 'gold', 4.5], ['ink', 'goldHover', 4.5], ['deep', 'goldHover', 4.5],
  ['deep', 'lightGold', 4.5],
  /* one-off literals that carry text */
  ['buildCap', 'limestone', 4.5], ['cardMeta', 'paper', 4.5], ['sage', 'readonlyBg', 4.5],
];
/* Colours that must NEVER carry text on a light ground. */
const BANNED = [
  ['gold', 'paper'], ['gold', 'limestone'], ['clay', 'paper'], ['clay', 'limestone'],
  ['lightGold', 'paper'], ['greyDecorative', 'paper'], ['greyDecorative', 'limestone'],
];

/* The ratios above compare constants, so they document the rules but cannot catch a banned
   colour being reintroduced as text. This scan reads the real files and fails the build if one is.

   Two subtleties this has to get right:
   1. `border-color:` and `outline-color:` CONTAIN the substring `color:`. A naive regex flags
      them and produces false failures, so the match requires no `-` before `color`.
   2. gold and clay ARE legal on a dark ground. The selectors below are the reviewed uses,
      each measured. Keying on selector rather than line number means they survive a rename. */
const BANNED_AS_TEXT = { '#C59332': 'gold', '#E2BE73': 'lightGold', '#9DBBE0': 'clay', '#A3ABB8': 'greyDecorative' };

const DARK_GROUND_OK = [
  ['.dev-hero-eyebrow',          'eyebrow over the dark image scrim on the listings hero (light gold on darkest)'],
  ['.phero-loc',                 'pin icon over the dark scrim of a listing hero (gold on darkest, 6.8:1)'],
  ['.proj-loc svg',              'pin icon on the dark scrim of a carousel card (gold on deep, 6.1:1)'],
  ['.proj-price',                'price on the dark scrim of a carousel card (gold on deep, 6.1:1)'],
  ['.build-eyebrow',             'eyebrow on the build-scrub stage'],
  ['.why-bar-item.is-on .n',     'active number on the dark topic bar (gold on deep, 6.1:1)'],
  ['.res-row.is-dark .res-badge','badge on a dark unit row (gold on deep, 6.1:1)'],
  ['.res-row.is-dark .res-cta',  'gold button on a dark unit row (deep text on gold, 6.1:1)'],
  ['.pay-label',                 'stage label in the navy payment section (light gold on deep)'],
  ['.faq-help',                  'link on the navy help panel'],
  ['.lbox',                      'lightbox controls on the near-black overlay'],
  ['.res-arrow:hover',           'gallery arrow hover (deep icon on gold)'],
  ['.res-expand:hover',          'gallery expand hover (deep icon on gold)'],
];

const SCANNED = [...globSync('*.html'), 'assets/listing-sections.css'];

let failed = 0;

for (const file of SCANNED) {
  let src;
  try {
    src = readFileSync(file, 'utf8');
  } catch {
    continue; /* a page renamed by a later task is not a failure here */
  }
  const lines = src.split('\n');
  lines.forEach((text, i) => {
    for (const [hex, name] of Object.entries(BANNED_AS_TEXT)) {
      /* (?<!-) keeps border-color / outline-color from matching */
      if (!new RegExp(`(?<!-)color:\\s*${hex}`, 'i').test(text)) continue;
      const context = lines.slice(Math.max(0, i - 6), i + 1).join('\n');
      const allowed = DARK_GROUND_OK.find(([sel]) => context.includes(sel));
      if (allowed) {
        console.log(`NOTE  ${file}:${i + 1} ${name} on a dark ground — ${allowed[1]}`);
        continue;
      }
      failed++;
      console.log(`FAIL  ${file}:${i + 1} uses ${name} ${hex} as text on an unreviewed ground`);
    }
  });
}

/* Third check: a rule that sets BOTH its own background and its text colour as literal hex must
   clear AA on its own. The pair list above cannot see this — it measures tokens, not rules — and a
   token remap can quietly turn a legible pairing illegible: dark ink on the darker gold, for example, fails AA even though both tokens pass on their own. */
for (const file of SCANNED) {
  let src;
  try { src = readFileSync(file, 'utf8'); } catch { continue; }
  for (const m of src.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const bg = (m[2].match(/background(?:-color)?:\s*(#[0-9A-Fa-f]{6})\b/) || [])[1];
    const fg = (m[2].match(/(?<!-)color:\s*(#[0-9A-Fa-f]{6})\b/) || [])[1];
    if (!bg || !fg) continue;
    const r = ratio(fg, bg);
    if (r >= 4.5) continue;
    failed++;
    console.log(`FAIL  ${file}: ${m[1].trim().split('\n').pop()} sets ${fg} on ${bg} — ${r.toFixed(2)}:1`);
  }
}

for (const [fg, bg, min] of PAIRS) {
  const r = ratio(T[fg], T[bg]);
  const ok = r >= min;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${fg} on ${bg}  ${r.toFixed(2)}:1 (min ${min})`);
}
for (const [fg, bg] of BANNED) {
  const r = ratio(T[fg], T[bg]);
  console.log(`NOTE  ${fg} on ${bg} is ${r.toFixed(2)}:1 — banned for text, decorative only`);
}
console.log(failed ? `\n${failed} FAILED` : '\nALL PASS');
process.exit(failed ? 1 : 0);
