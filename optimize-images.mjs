// Image pipeline for the Blu Real Estate build: crops each source render and writes responsive
// WebP variants (plus AVIF for the LCP hero). Sources are left untouched.
//
// Every source is a developer's render that Blu Real Estate posted on Instagram
// (brand_assets/blu-source/, provenance in its PROVENANCE.md). Most carry Blu's flyer overlays:
// a "BOOK A HOME IN … FOR | beds | sq ft | price" panel top-left, and the blu logo + phone number
// bottom-left. Several also carry a developer watermark or sign. Each `extract` rectangle below was
// measured against a 100px grid so that NONE of that text survives into the crop — prices in
// particular must come from the page copy (sourced, dated), never from pixels.
import sharp from 'sharp';
import { mkdirSync, statSync } from 'node:fs';

const SRC = 'brand_assets/blu-source';
const OUT = 'brand_assets/optimized';
mkdirSync(OUT, { recursive: true });

const WEBP = { quality: 78, effort: 5 };
const AVIF = { quality: 52, effort: 5 };

const INTERIOR = { left: 0, top: 0, width: 1080, height: 920 };      // drops the bottom-left logo
const LABELLED = { left: 0, top: 80, width: 1080, height: 840 };     // also drops a top-left room label

// [source, slug, extract, widths, avif?]
const JOBS = [
  // Homepage + Wavecrest hero: the aerial with the sea; the flyer panel sits above y=214.
  ['collection-4', 'wavecrest-hero', { left: 0, top: 214, width: 1920, height: 866 }, [768, 1152, 1536, 1920], true],

  // Award-Winning Skyline (Nyali, off Links Road)
  ['skyline-1', 'skyline-tower', { left: 560, top: 110, width: 520, height: 830 }, [520]],
  ['skyline-2', 'skyline-facade', { left: 0, top: 220, width: 1080, height: 720 }, [640, 1080]],
  ['skyline-4', 'skyline-living', { left: 0, top: 110, width: 1080, height: 830 }, [640, 1080]], // its logo sits top-left
  ['skyline-5', 'skyline-kitchen', INTERIOR, [640, 1080]],

  // Home to Modern Luxury (Nyali, off Links Road / Baobab Road)
  ['home-1', 'modern-front', { left: 470, top: 200, width: 610, height: 740 }, [610]],
  ['home-2', 'modern-aerial', { left: 0, top: 450, width: 1080, height: 510 }, [640, 1080]],
  ['home-3', 'modern-dining', INTERIOR, [640, 1080]],
  ['home-4', 'modern-kitchen', INTERIOR, [640, 1080]],
  ['home-5', 'modern-bedroom', INTERIOR, [640, 1080]],

  // Modern Luxury Living (Nyali). The render's ground-floor sign (y≈900) is cropped out.
  ['living-1', 'living-tower', { left: 0, top: 215, width: 1080, height: 670 }, [640, 1080]],
  ['living-1', 'living-tower-p', { left: 300, top: 215, width: 560, height: 670 }, [560]],
  ['living-2', 'living-lounge', INTERIOR, [640, 1080]],
  ['living-3', 'living-dining', INTERIOR, [640, 1080]],
  ['living-4', 'living-kitchen', INTERIOR, [640, 1080]],
  ['living-5', 'living-bedroom', INTERIOR, [640, 1080]],

  // Unrivaled Luxury Apartments (Nyali, near the golf club)
  ['unrivaled-1', 'unrivaled-towers', { left: 0, top: 205, width: 1080, height: 730 }, [640, 1080]],
  ['unrivaled-1', 'unrivaled-tower-p', { left: 650, top: 170, width: 430, height: 770 }, [430]],
  ['unrivaled-4', 'unrivaled-lounge', LABELLED, [640, 1080]],
  ['unrivaled-5', 'unrivaled-dining', LABELLED, [640, 1080]],

  // Seaside Elegance (Nyali, near Voyager). The aerial stops above the amenities panel.
  ['seaside-1', 'seaside-tower', { left: 560, top: 95, width: 520, height: 845 }, [520]],
  ['seaside-2', 'seaside-aerial', { left: 0, top: 0, width: 1080, height: 625 }, [640, 1080]],
  ['seaside-3', 'seaside-living', INTERIOR, [640, 1080]],
  ['seaside-4', 'seaside-dining', INTERIOR, [640, 1080]],
  ['seaside-5', 'seaside-kitchen', INTERIOR, [640, 1080]],

  // Wavecrest Residency (2nd Avenue, Nyali)
  ['avenue-1', 'wavecrest-aerial', { left: 0, top: 205, width: 1080, height: 735 }, [640, 1080]],
  ['avenue-3', 'wavecrest-living', INTERIOR, [640, 1080]],
  ['avenue-4', 'wavecrest-dining', INTERIOR, [640, 1080]],
  ['avenue-5', 'wavecrest-kitchen', INTERIOR, [640, 1080]],

  // Family Residential Resort (Kizingo)
  ['kizingo-1', 'kizingo-tower', { left: 0, top: 185, width: 1080, height: 755 }, [640, 1080]],
  ['kizingo-1', 'kizingo-tower-p', { left: 250, top: 185, width: 620, height: 755 }, [620]],
  ['kizingo-2', 'kizingo-aerial', { left: 0, top: 450, width: 1080, height: 500 }, [640, 1080]],
  ['kizingo-3', 'kizingo-living', INTERIOR, [640, 1080]],
  ['kizingo-4', 'kizingo-dining', INTERIOR, [640, 1080]],
  ['kizingo-5', 'kizingo-bedroom', INTERIOR, [640, 1080]],

  // Emaar Apartments (Stadium). Only the tower survives the flyer; its interior insets are too small.
  ['stadium-1', 'emaar-tower', { left: 40, top: 150, width: 455, height: 1050 }, [455]],
];

const kb = (p) => (statSync(p).size / 1024).toFixed(0) + 'KB';
let total = 0;

for (const [src, slug, extract, widths, avif] of JOBS) {
  const file = `${SRC}/${src}.jpg`;
  const crop = sharp(file).extract(extract);
  for (const w of widths) {
    if (w > extract.width) throw new Error(`${slug}: ${w}px would upscale a ${extract.width}px crop`);
    const base = crop.clone().resize({ width: w });
    const wp = `${OUT}/${slug}-${w}.webp`;
    await base.clone().webp(WEBP).toFile(wp);
    total += statSync(wp).size;
    let line = `${slug}-${w}: webp ${kb(wp)}`;
    if (avif) {
      const a = `${OUT}/${slug}-${w}.avif`;
      await base.clone().avif(AVIF).toFile(a);
      total += statSync(a).size;
      line += `  avif ${kb(a)}`;
    }
    console.log(`${line}  (${extract.width}x${extract.height} from ${src})`);
  }
}
console.log(`done — ${(total / 1048576).toFixed(1)}MB written`);
