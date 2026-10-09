import puppeteer from 'puppeteer';

import { readdirSync } from 'node:fs';

// Every page in the root: the five hand-written pages plus every generated listing-*.html and agent-*.html
// (scripts/build-pages.mjs), so a new listing or agent is checked without editing this file.
const pages = ['', ...readdirSync('.').filter((f) => f.endsWith('.html') && f !== 'index.html').map((f) => f.replace(/\.html$/, ''))];

// Port 3000 is often taken by another project's dev server, which answers 200 for every path
// and turns this into a false pass. Default to the port serve.mjs is actually started on.
const ORIGIN = process.env.URL || `http://127.0.0.1:${process.env.PORT || 3002}`;
const browser = await puppeteer.launch();
let problems = 0;

for (const p of pages) {
  const url = `${ORIGIN}/${p}${p ? '.html' : ''}`;
  const page = await browser.newPage();
  const failed = [];
  const errors = [];
  page.on('requestfailed', (r) => failed.push(`${r.failure()?.errorText} ${r.url()}`));
  page.on('response', (r) => { if (r.status() >= 400) failed.push(`HTTP ${r.status()} ${r.url()}`); });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  // scroll the page so lazy-loaded images actually resolve before we judge it clean
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y < h; y += 800) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
    scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 900));
  const brokenImgs = await page.evaluate(() =>
    [...document.images].filter((i) => i.complete && !i.naturalWidth).map((i) => i.src));
  brokenImgs.forEach((src) => failed.push(`broken image ${src}`));
  const label = p || 'index';
  if (failed.length || errors.length) {
    problems += failed.length + errors.length;
    console.log(`\n❌ ${label}`);
    failed.forEach((f) => console.log('   req:', f));
    errors.forEach((e) => console.log('   err:', e));
  } else {
    console.log(`✅ ${label} — no failed requests, no console errors`);
  }
  await page.close();
}
await browser.close();
console.log(`\n${problems === 0 ? 'ALL CLEAN' : problems + ' problem(s) found'}`);
process.exit(problems === 0 ? 0 : 1);
