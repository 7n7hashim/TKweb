/** Static Tailwind build config — replaces the in-browser cdn.tailwindcss.com JIT.
 *  Scans every page so only utilities actually used are emitted (purged).
 *
 *  Token NAMES are inherited from earlier builds so every page restyles without touching a class;
 *  only the VALUES move. `forest` is the primary (navy), `sage` a slate grey, `clay` a sea blue —
 *  misnomers kept for stability. The values mirror THEME in scripts/site-data.mjs and are
 *  rewritten together with every stylesheet by `node scripts/apply-theme.mjs`.
 *  `gold` fails AA on the light grounds (2.67:1), so `goldtext` carries gold as text on light
 *  (5.56:1 on paper). Every text-bearing pair is measured by scripts/check-contrast.mjs. */
module.exports = {
  content: ['./*.html'],
  theme: {
    extend: {
      colors: {
        gold: '#C59332',      // accent gold — rules, icons, on-dark accent
        goldtext: '#82601C',  // AA-safe gold text on light grounds (5.56:1 on paper)
        goldsoft: '#F7F0E1',  // gold wash
        forest: '#002865',    // primary navy — surfaces, nav, buttons
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
        // Montserrat display, used light (300) with heavy (800) emphasis; Inter for body.
        display: ['Montserrat', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};
