import puppeteer from 'puppeteer';
import { readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const url = process.argv[2] || 'http://127.0.0.1:3002';
const label = process.argv[3];

const DIR = join(fileURLToPath(new URL('.', import.meta.url)), 'temporary screenshots');
mkdirSync(DIR, { recursive: true });

const nums = readdirSync(DIR)
  .map((f) => f.match(/^screenshot-(\d+)/))
  .filter(Boolean)
  .map((m) => Number(m[1]));
const n = (nums.length ? Math.max(...nums) : 0) + 1;
const out = join(DIR, `screenshot-${n}${label ? `-${label}` : ''}.png`);

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise((r) => setTimeout(r, 500));
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(out);
