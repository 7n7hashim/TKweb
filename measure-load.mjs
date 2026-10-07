import puppeteer from 'puppeteer';

// Emulate a mid-tier connection so numbers reflect the real world, not localhost RAM speed.
const PROFILES = {
  'Fast 4G': { downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (3 * 1024 * 1024) / 8, latency: 40 },
  'Slow 4G': { downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (0.75 * 1024 * 1024) / 8, latency: 150 },
  'No throttle (localhost)': null,
};

const url = process.argv[2] || 'http://127.0.0.1:3002/';

for (const [name, profile] of Object.entries(PROFILES)) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setCacheEnabled(false); // cold load
  if (profile) {
    const c = await page.target().createCDPSession();
    await c.send('Network.emulateNetworkConditions', { offline: false, ...profile });
    await c.send('Emulation.setCPUThrottlingRate', { rate: 4 }); // simulate a mid mobile CPU
  }
  const start = Date.now();
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  const loadMs = Date.now() - start;

  const m = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    let lcp = 0;
    return new Promise((resolve) => {
      try {
        new PerformanceObserver((l) => { const e = l.getEntries(); lcp = e[e.length - 1].startTime; })
          .observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {}
      setTimeout(() => resolve({
        dcl: Math.round(nav.domContentLoadedEventEnd),
        load: Math.round(nav.loadEventEnd),
        fcp: fcp ? Math.round(fcp.startTime) : null,
        lcp: Math.round(lcp),
        transferKB: Math.round((performance.getEntriesByType('resource').reduce((s, r) => s + (r.transferSize || 0), 0) + (nav.transferSize || 0)) / 1024),
      }), 300);
    });
  });

  console.log(`\n${name}`);
  console.log(`  First Contentful Paint : ${(m.fcp / 1000).toFixed(2)}s`);
  console.log(`  Largest Contentful Paint: ${(m.lcp / 1000).toFixed(2)}s`);
  console.log(`  DOMContentLoaded        : ${(m.dcl / 1000).toFixed(2)}s`);
  console.log(`  Load event              : ${(m.load / 1000).toFixed(2)}s  (wall ${(loadMs / 1000).toFixed(2)}s)`);
  console.log(`  Transferred             : ${m.transferKB} KB`);
  await browser.close();
}
