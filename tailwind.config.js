/** Static Tailwind build config — replaces the in-browser cdn.tailwindcss.com JIT.
 *  Scans every page so only utilities actually used are emitted (purged).
 *
 *  Blu Real Estate — a property consultancy in Mombasa (buy, sell, rent).
 *  Token NAMES are inherited from the earlier builds so every page restyles without touching
 *  a single class; only the VALUES moved, each keeping its original role. (`forest`, `sage`
 *  and the `gold` / `clay` families are misnomers here and there — `forest` carries Blu navy,
 *  `sage` a slate grey, `clay` a sea blue. `gold` is, for once, actually gold.)
 *
 *  The palette is sampled from Blu's own logo (brand_assets/blu-source/logo-post.jpg): a navy
 *  ground (#002865), a gold half-house mark and "real" (#C59332), white "blu" and "ESTATE".
 *  `forest` IS the logo navy. Gold on navy clears AA (5.09:1); gold on the light grounds does
 *  not (2.67:1), so `goldtext` walks the same hue down to #82601C for text on light (5.56:1 on
 *  paper). Every text-bearing pair is measured by scripts/check-contrast.mjs, not assumed. */
module.exports = {
  content: ['./*.html'],
  theme: {
    extend: {
      colors: {
        gold: '#C59332',      // the logo's gold — rules, icons, on-dark accent
        goldtext: '#82601C',  // AA-safe gold text on light grounds (5.56:1 on paper)
        goldsoft: '#F7F0E1',  // gold wash
        forest: '#002865',    // Blu navy (logo) — primary surfaces, nav, buttons
        deep: '#001B45',      // darkest ground, footer
        ink: '#0B1A33',       // body ink (16.73:1 on paper)
        sage: '#4F5B6E',      // muted slate text (6.63:1 on paper)
        limestone: '#EEF2F7', // "sea mist" — pale ground, tinted from the navy
        paper: '#F9FBFD',     // base
        line: '#DCE3EC',      // hairlines
        clay: '#9DBBE0',      // sea blue (dark grounds only)
        claydeep: '#2C5791',  // sea blue for text on light
        claysoft: '#E9EFF7',  // pale sea-blue ground
      },
      fontFamily: {
        // Blu's logo and flyers are set in Montserrat: the display face, used light (300) with
        // heavy (800) emphasis, the way the logo pairs a light "blu" with a black "real".
        display: ['Montserrat', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};
