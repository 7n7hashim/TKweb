// Scrolls a selector into view (so lazy images load) then captures the viewport.
// Usage: node shot.mjs <selector> <label> [width] [motion]
import puppeteer from 'puppeteer';
const [,, sel, label, wStr, motion] = process.argv;
const w = Number(wStr || 1440);
const b = await puppeteer.launch();
const p = await b.newPage();
if (motion === 'motion') await p.evaluateOnNewDocument(()=>Object.defineProperty(navigator,'webdriver',{get:()=>false}));
await p.setViewport({ width: w, height: 900, deviceScaleFactor: 1.5 });
await p.goto(process.env.URL || `http://127.0.0.1:${process.env.PORT || 3002}/`, { waitUntil: 'networkidle0' });
await p.evaluate((sel) => {
  const el = document.querySelector(sel);
  if (el) el.scrollIntoView({ block: 'center' });
}, sel);
await new Promise(r => setTimeout(r, 900));
// wait for any images now in view
await p.evaluate(async () => {
  await Promise.all([...document.images].filter(i=>!i.complete)
    .map(i=>new Promise(r=>{i.onload=i.onerror=r; setTimeout(r,3000);})));
});
await new Promise(r => setTimeout(r, 300));
await p.screenshot({ path: `temporary screenshots/${label}.png` });
const broken = await p.evaluate(()=>[...document.images].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src.slice(0,70)));
await b.close();
console.log(`temporary screenshots/${label}.png`, broken.length?`| BROKEN: ${broken.join(', ')}`:'| all images ok');
