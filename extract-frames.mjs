import puppeteer from 'puppeteer';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const VIDEO = join(ROOT, 'brand_assets', 'video of house being built.mp4');
const OUT = join(ROOT, 'brand_assets', 'build-frames');
const N = 120;

// System Google Chrome has H.264; puppeteer's bundled Chromium usually does not.
const SYS_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const run = async () => {
  await mkdir(OUT, { recursive: true });
  const buf = await readFile(VIDEO);
  const src = 'data:video/mp4;base64,' + buf.toString('base64');

  const launch = { headless: true, args: ['--autoplay-policy=no-user-gesture-required'] };
  if (existsSync(SYS_CHROME)) launch.executablePath = SYS_CHROME;
  const browser = await puppeteer.launch(launch);
  const page = await browser.newPage();
  await page.setContent('<canvas id="c"></canvas><video id="v" muted playsinline></video>');

  const meta = await page.evaluate(async (src) => {
    const v = document.getElementById('v');
    v.src = src;
    await new Promise((res, rej) => {
      v.addEventListener('loadeddata', res, { once: true });
      v.addEventListener('error', () => rej(new Error('video load/decoding error')), { once: true });
    });
    return { duration: v.duration, w: v.videoWidth, h: v.videoHeight };
  }, src);
  console.log(`loaded: duration=${meta.duration.toFixed(2)}s size=${meta.w}x${meta.h}`);
  if (!meta.w) throw new Error('videoWidth is 0 — codec/decoding failed');

  for (let i = 0; i < N; i++) {
    // pull back slightly from the exact end; seeking to duration can return a blank frame
    const t = (i / (N - 1)) * Math.max(meta.duration - 0.03, 0);
    const { b64, bright } = await page.evaluate(async (t) => {
      const v = document.getElementById('v');
      const c = document.getElementById('c');
      await new Promise((res) => { v.addEventListener('seeked', res, { once: true }); v.currentTime = t; });
      c.width = v.videoWidth; c.height = v.videoHeight;
      const ctx = c.getContext('2d');
      ctx.drawImage(v, 0, 0);
      // sample average brightness to prove decoding produced real (non-black) frames
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let s = 0; const step = 4 * 97;
      for (let k = 0; k < d.length; k += step) s += (d[k] + d[k + 1] + d[k + 2]) / 3;
      const bright = s / (d.length / step);
      return { b64: c.toDataURL('image/webp', 0.82).split(',')[1], bright };
    }, t);
    const name = `frame-${String(i).padStart(3, '0')}.webp`;
    await writeFile(join(OUT, name), Buffer.from(b64, 'base64'));
    if (i % 20 === 0 || i === N - 1) console.log(`  ${name}  brightness=${bright.toFixed(1)}`);
  }
  await browser.close();
  console.log(`Done: ${N} frames in brand_assets/build-frames/`);
};
run().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
