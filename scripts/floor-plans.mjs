/* Schematic floor plans for development units, drawn as inline SVG by build-pages.mjs.
 *
 * Each plan is a list of rooms on a simple grid (x, y, w, h in metres-ish units) inside an outer
 * wall; `out: true` marks an outdoor space (terrace, pool), drawn dashed outside the walls.
 * They are ILLUSTRATIVE layouts for the demo. For a real development, replace a plan with the
 * architect's drawing: put an SVG/PNG in brand_assets/plans/ and set `planImage` on the unit.
 */
const R = (label, x, y, w, h, extra = {}) => ({ label, x, y, w, h, ...extra });

export const PLANS = {
  studio: { w: 54, h: 40, rooms: [
    R('Living / sleeping', 0, 0, 36, 40), R('Kitchen', 36, 0, 18, 14), R('Bath', 36, 14, 18, 12), R('Entry', 36, 26, 18, 14),
    R('Balcony', 0, 40, 36, 9, { out: true }),
  ] },
  '1br': { w: 70, h: 46, rooms: [
    R('Kitchen', 0, 0, 40, 16), R('Living & dining', 0, 16, 40, 30), R('Bedroom', 40, 0, 30, 26), R('Bath', 40, 26, 14, 20), R('Entry', 54, 26, 16, 20),
    R('Terrace', 0, 46, 40, 9, { out: true }),
  ] },
  '2br': { w: 90, h: 60, rooms: [
    R('Kitchen', 0, 0, 30, 18), R('Laundry', 30, 0, 18, 18), R('Living & dining', 0, 18, 48, 42),
    R('Bedroom 2', 48, 0, 24, 24), R('Bath', 72, 0, 18, 12), R('Store', 72, 12, 18, 12), R('Hall', 48, 24, 42, 12),
    R('Main bedroom', 48, 36, 30, 24), R('En suite', 78, 36, 12, 24),
    R('Terrace', 0, 60, 48, 9, { out: true }),
  ] },
  '3br': { w: 110, h: 64, rooms: [
    R('Kitchen', 0, 0, 26, 20), R('Laundry', 26, 0, 12, 20), R('DSQ', 38, 0, 12, 20), R('Living & dining', 0, 20, 50, 44),
    R('Bedroom 2', 50, 0, 22, 24), R('Bath', 72, 0, 14, 24), R('Bedroom 3', 86, 0, 24, 24), R('Hall', 50, 24, 60, 10),
    R('Main bedroom', 50, 34, 36, 30), R('En suite', 86, 34, 24, 16), R('Dressing', 86, 50, 24, 14),
    R('Terrace', 0, 64, 50, 9, { out: true }),
  ] },
  '4br': { w: 120, h: 64, rooms: [
    R('Kitchen', 0, 0, 26, 20), R('Laundry', 26, 0, 12, 20), R('DSQ', 38, 0, 12, 20), R('Living & dining', 0, 20, 50, 44),
    R('Bedroom 2', 50, 0, 20, 24), R('Bath', 70, 0, 14, 24), R('Bedroom 3', 84, 0, 18, 24), R('Bedroom 4', 102, 0, 18, 24),
    R('Hall', 50, 24, 70, 10), R('Main bedroom', 50, 34, 40, 30), R('En suite', 90, 34, 30, 16), R('Dressing', 90, 50, 30, 14),
    R('Roof terrace', 0, 64, 120, 10, { out: true }),
  ] },
  villa: { w: 120, h: 70, rooms: [
    R('Living', 0, 0, 44, 38), R('Dining', 44, 0, 28, 38), R('Kitchen', 72, 0, 26, 22), R('Scullery', 98, 0, 22, 22), R('Guest suite', 72, 22, 48, 16),
    R('Main suite', 0, 38, 40, 32), R('En suite', 40, 38, 16, 32), R('Bedroom 2', 56, 38, 32, 32), R('Bedroom 3', 88, 38, 32, 32),
    R('Pool & veranda', 0, 70, 72, 14, { out: true, pool: true }),
  ] },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

/* Labels shrink to fit narrow rooms; very small rooms drop to their first word. No room areas:
   the layouts are schematic, so a figure per room would be invented precision. */
function label(r) {
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  const fit = (t) => Math.min(2.2, (r.w - 3) / (t.length * 0.66));
  const text = fit(r.label) < 1.4 ? r.label.split(/[ /&]+/)[0] : r.label;
  return `<text class="fp-label" x="${cx}" y="${cy}" font-size="${Math.max(1.3, fit(text)).toFixed(2)}">${esc(text.toUpperCase())}</text>`;
}

export function planSvg(key, title) {
  const p = PLANS[key];
  if (!p) throw new Error(`no floor plan "${key}"`);
  const outH = Math.max(0, ...p.rooms.filter((r) => r.out).map((r) => r.y + r.h - p.h));
  const pad = 4;
  const rooms = p.rooms.map((r) => r.out
    ? `<rect class="fp-out${r.pool ? ' fp-pool' : ''}" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/>${label(r)}`
    : `<rect class="fp-room" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/>${label(r)}`).join('');
  return `<svg class="fp-svg" viewBox="${-pad} ${-pad} ${p.w + pad * 2} ${p.h + outH + pad * 2}" role="img" aria-label="${esc(title)}: illustrative floor plan">` +
    `${rooms}<rect class="fp-wall" x="0" y="0" width="${p.w}" height="${p.h}"/></svg>`;
}
