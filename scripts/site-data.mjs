/* ============================================================================================
   SITE DATA — the one file to edit when this site is set up for a client.

   1. BRAND      company name, logo, phone / WhatsApp, email, office, hours, social links
   2. THEME      the two brand colours (+ their working shades) — apply with
                 `node scripts/apply-theme.mjs`
   3. LOCATIONS  the areas the client works in (filters, footer, contact page)
   4. AGENTS     the team: one profile page each, with their listings
   5. LISTINGS   properties and developments: one page each, plus every card on the site

   After editing:  node scripts/build-pages.mjs  (then rebuild Tailwind — see CLAUDE.md)

   Everything below is DEMO content: a fictional company, fictional listings and fictional
   people, with licensed stock photography. Swap it for the client's real details.
   ============================================================================================ */

/* ---------- 1. BRAND ---------- */
export const BRAND = {
  name: 'Your Company Name',
  descriptor: 'Properties & Developments',       // the small line under the wordmark
  // A client logo for DARK grounds (white/light artwork), e.g. 'brand_assets/client-logo.svg'.
  // null = the built-in wordmark: the mark below + the company name set in Montserrat.
  logo: null,
  logoSize: [200, 80],                            // width/height of the client logo file, if any
  mark: 'brand_assets/mark.svg',                  // the small emblem (favicon, header, footer)
  tagline: 'Exceptional properties. Remarkable places.',
  summary: 'Homes for sale and to let, new developments, land and commercial space across Nairobi and the Kenyan coast — with one team from the first viewing to the keys.',
  services: ['Sales', 'Lettings', 'Developments', 'Management'],
  phone: '+254 700 000 000',
  phoneTel: '+254700000000',
  whatsapp: '254700000000',                       // digits only, country code first
  email: 'hello@yourcompany.co.ke',
  office: ['Westlands, Nairobi', 'Nyali, Mombasa'],
  hours: ['Monday to Friday, 8:30 to 17:30', 'Saturday, 9:00 to 13:00'],
  social: {
    instagram: 'https://www.instagram.com/',
    facebook: 'https://www.facebook.com/',
    linkedin: 'https://www.linkedin.com/',
  },
  currency: 'KES',
  disclaimer: 'Prices, availability and specifications are subject to change. Images are for illustration.',
};

export const waLink = (text) => `https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(text)}`;
export const emailDomain = BRAND.email.split('@')[1];

/* ---------- 2. THEME ----------
   The palette every page uses. `primary` is the dark brand colour (nav, buttons, dark grounds),
   `accent` the bright one (rules, icons, accents on dark). The other values are the shades the
   design needs around them — keep their roles, change their values. scripts/apply-theme.mjs
   rewrites every stylesheet, page and script from the last applied palette to this one;
   scripts/check-contrast.mjs then proves the text pairs still read. */
export const THEME = {
  primary: '#002865',       // nav, buttons, surfaces            (tailwind: forest)
  primaryDeep: '#001B45',   // footer, dark sections             (deep)
  primaryDarkest: '#00112B',// hero scrims                       (darkest)
  primaryHover: '#1A2E52',  // nav links on white
  ink: '#0B1A33',           // body text
  muted: '#4F5B6E',         // secondary text                    (sage)
  accent: '#C59332',        // rules, icons, accents on dark     (gold)
  accentText: '#82601C',    // accent as text on light grounds   (goldtext)
  accentLight: '#E2BE73',   // accent text on dark grounds
  accentHover: '#D4A54A',   // gold button hover
  accentWash: '#F7F0E1',    // accent tint ground                (goldsoft)
  ground: '#EEF2F7',        // pale section ground               (limestone)
  paper: '#F9FBFD',         // page base                         (paper)
  line: '#DCE3EC',          // hairlines                         (line)
  cool: '#9DBBE0',          // secondary accent, dark grounds    (clay)
  coolText: '#2C5791',      // secondary accent as text on light (claydeep)
  coolWash: '#E9EFF7',      // pale card ground                  (claysoft)
};

/* ---------- 3. LOCATIONS ---------- */
export const REGIONS = { nairobi: 'Nairobi', coast: 'The Coast' };
export const LOCATIONS = {
  westlands: { label: 'Westlands', region: 'nairobi', city: 'Nairobi', blurb: 'Nairobi’s business and dining district, ten minutes from the CBD.' },
  kilimani: { label: 'Kilimani', region: 'nairobi', city: 'Nairobi', blurb: 'Leafy, central and close to Yaya Centre and the Arboretum.' },
  lavington: { label: 'Lavington', region: 'nairobi', city: 'Nairobi', blurb: 'Quiet residential roads, gardens and some of the city’s best schools.' },
  'upper-hill': { label: 'Upper Hill', region: 'nairobi', city: 'Nairobi', blurb: 'Head offices, hospitals and Grade A commercial space.' },
  nyali: { label: 'Nyali', region: 'coast', city: 'Mombasa', blurb: 'Mombasa’s north shore: beaches, the golf club and the marina.' },
  vipingo: { label: 'Vipingo', region: 'coast', city: 'Kilifi', blurb: 'Gated coastal estates north of Mtwapa, on the ocean and the golf course.' },
  kilifi: { label: 'Kilifi', region: 'coast', city: 'Kilifi', blurb: 'The creek, the open ocean and land with room to build.' },
  diani: { label: 'Diani', region: 'coast', city: 'Kwale', blurb: 'Seventeen kilometres of white beach on the south coast.' },
};

/* ---------- 4. AGENTS ----------
   `photo`: a square headshot path, or null for a monogram. Each agent reaches the client through
   the company number (WhatsApp messages name the agent); `email` is built from the company domain. */
export const AGENTS = [
  {
    slug: 'amina-hassan',
    name: 'Amina Hassan',
    title: 'Senior Property Consultant',
    focus: ['Luxury residential', 'Coastal property'],
    areas: ['nyali', 'vipingo', 'diani', 'kilifi'],
    languages: ['English', 'Kiswahili', 'Arabic'],
    photo: null,
    bio: [
      'Amina handles the coastal portfolio, from beachfront villas in Diani to new apartments in Nyali and land around Kilifi Creek.',
      'Most of her buyers live in Nairobi or abroad, so she runs viewings in person or on video, and keeps every sale moving with the lawyers and the developer.',
    ],
  },
  {
    slug: 'david-mwangi',
    name: 'David Mwangi',
    title: 'Head of New Developments',
    focus: ['Off-plan sales', 'Development marketing'],
    areas: ['westlands', 'kilimani'],
    languages: ['English', 'Kiswahili'],
    photo: null,
    bio: [
      'David works with developers from the first price list to the last handover: unit releases, payment plans, construction updates and buyer documentation.',
      'For buyers, he explains exactly what is being bought off-plan, how the payments line up with the build, and what happens at handover.',
    ],
  },
  {
    slug: 'grace-wanjiru',
    name: 'Grace Wanjiru',
    title: 'Lettings & Property Manager',
    focus: ['Rentals', 'Property management'],
    areas: ['lavington', 'kilimani', 'westlands'],
    languages: ['English', 'Kiswahili'],
    photo: null,
    bio: [
      'Grace lets and manages homes for owners across Nairobi: tenant checks, leases, rent collection, maintenance and the inspection at the end of a tenancy.',
      'Tenants deal with her directly, from the first viewing to the day they move in.',
    ],
  },
  {
    slug: 'brian-otieno',
    name: 'Brian Otieno',
    title: 'Commercial & Investment Advisor',
    focus: ['Commercial property', 'Investment advisory'],
    areas: ['upper-hill', 'westlands'],
    languages: ['English', 'Kiswahili', 'Dholuo'],
    photo: null,
    bio: [
      'Brian advises companies on office space and investors on income property: lease terms, service charges, yields and the numbers behind a purchase.',
      'He also handles prime residential resales in Westlands and Riverside.',
    ],
  },
];

/* ---------- 5. LISTINGS ----------
   kind      'development' (a project with units, floor plans and a build schedule) or
             'property' (one home, plot or space)
   purpose   'sale' | 'rent'
   type      what it is, as a buyer would say it ('Apartments', 'Villa', 'Office space', 'Land' …)
   status    the badge: 'Off-plan', 'Under construction', 'Completing 2027', 'For sale', 'To let'
   price     { label: shown on cards, num + unit + note: the spec strip, from: true = "from" }
   facts     the card's three figures; `spec` (optional) overrides the strip on the listing page
   images    names from brand_assets/optimized/manifest.json — cover (3:2), portrait (4:5),
             gallery (each a `-g` crop); `alt` describes what the photo shows
   plan      on a unit: a floor-plan key from scripts/floor-plans.mjs */
export const LISTINGS = [
  /* ---------------- developments ---------------- */
  {
    slug: 'azure-residences',
    kind: 'development',
    name: 'Azure Residences',
    purpose: 'sale',
    type: 'Apartments',
    category: 'residential',
    location: 'nyali',
    address: 'Links Road, Nyali, Mombasa',
    status: 'Off-plan',
    featured: true,
    agent: 'amina-hassan',
    ref: 'AZR-01',
    intro: 'Twenty-two floors of ocean-facing apartments off Links Road, with a rooftop infinity pool and every home on a deep private terrace.',
    headline: ['Ocean on one side,', 'the city on the other.'],
    about: [
      'One- to four-bedroom apartments and two duplex penthouses, each with a terrace deep enough to dine on. Every bedroom is en suite, and the three- and four-bedroom homes add a DSQ.',
      'Shared spaces sit at the top and the bottom of the building: an infinity pool and residents’ lounge on the roof, a gym, a children’s play area and landscaped gardens at street level.',
    ],
    price: { label: 'From KES 14.5M', num: '14.5', unit: 'M', note: 'from', from: true },
    beds: '1–4', baths: '1–5', area: '820–3,100', areaUnit: 'sq ft',
    facts: [['1–4', 'BR', 'bedrooms'], ['1–5', '', 'bathrooms'], ['820', '', 'sq ft and up']],
    units: [
      { name: '1 bedroom', detail: 'En suite, terrace', beds: 1, baths: 1, size: '820 sq ft', sizeAlt: '76 m²', price: 'KES 14.5M', available: 9, total: 40, plan: '1br' },
      { name: '2 bedrooms', detail: 'All en suite, terrace', beds: 2, baths: 2, size: '1,350 sq ft', sizeAlt: '125 m²', price: 'KES 21M', available: 14, total: 48, plan: '2br' },
      { name: '3 bedrooms + DSQ', detail: 'All en suite, wraparound terrace', beds: 3, baths: 4, size: '2,150 sq ft', sizeAlt: '200 m²', price: 'KES 32M', available: 6, total: 28, plan: '3br' },
      { name: '4-bedroom duplex penthouse', detail: 'Private roof terrace', beds: 4, baths: 5, size: '3,100 sq ft', sizeAlt: '288 m²', price: 'KES 58M', available: 1, total: 2, plan: '4br' },
    ],
    construction: {
      percent: 35, stage: 'Superstructure — level 8 of 22', completion: 'Q4 2027',
      milestones: [['Groundbreaking', 'March 2026', 'done'], ['Foundations and basement', 'July 2026', 'done'], ['Superstructure', 'Under way', 'now'], ['Facade and finishes', '2027', ''], ['Handover', 'Q4 2027', '']],
    },
    highlights: ['Rooftop infinity pool', 'Every home on a private terrace', 'Two duplex penthouses'],
    amenities: ['Rooftop infinity pool', 'Residents’ sky lounge', 'Fully equipped gym', 'Children’s play area', 'Landscaped gardens', 'Two lifts per core', 'Backup generator and borehole', '24/7 security and CCTV', 'Basement parking'],
    payment: [['10%', 'Reservation', 'on signing'], ['30%', 'Deposit', 'within 60 days'], ['50%', 'Instalments', 'over the build'], ['10%', 'Balance', 'at handover']],
    paymentNote: '5% off the list price for buyers who pay in full within 90 days.',
    nearby: ['Nyali beach — 5 minutes', 'Nyali Golf & Country Club — 3 minutes', 'City Mall and Nyali Centre — 7 minutes', 'Moi International Airport — 35 minutes'],
    images: {
      cover: 'azure-tower', portrait: 'azure-tower-p',
      gallery: ['azure-living-g', 'azure-pool-g', 'azure-kitchen-g', 'azure-bedroom-g'],
    },
    alt: {
      'azure-tower': 'White apartment tower with deep stepped balconies against a blue sky',
      'azure-tower-p': 'Glass-fronted balconies stacked up the side of a white apartment tower',
      'azure-living-g': 'Open-plan living room with a cream sofa, dining table and kitchen beyond',
      'azure-pool-g': 'Rooftop infinity pool with a timber deck and lanterns at sunset',
      'azure-kitchen-g': 'Dark timber kitchen with a breakfast bar and green bar stools',
      'azure-bedroom-g': 'Bright bedroom with fitted wardrobes and a glass balustrade',
    },
  },
  {
    slug: 'the-grand-heights',
    kind: 'development',
    name: 'The Grand Heights',
    purpose: 'sale',
    type: 'Apartments',
    category: 'residential',
    location: 'westlands',
    address: 'Rhapta Road, Westlands, Nairobi',
    status: 'Under construction',
    featured: true,
    agent: 'david-mwangi',
    ref: 'TGH-02',
    intro: 'A 28-floor residential tower in Westlands: studios to three-bedroom apartments, with a sky garden halfway up and views over the Karura forest.',
    headline: ['Twenty-eight floors', 'above Westlands.'],
    about: [
      'Studios and one-bedroom apartments for first-time buyers and investors, two- and three-bedroom homes for families, and four penthouses on the top floor.',
      'The tower is walking distance from Sarit Centre and The Mall, and a ten-minute drive from the CBD. Rental demand in the area is steady year-round.',
    ],
    price: { label: 'From KES 8.9M', num: '8.9', unit: 'M', note: 'from', from: true },
    beds: 'Studio–3', baths: '1–3', area: '450–1,850', areaUnit: 'sq ft',
    facts: [['1–3', 'BR', 'plus studios'], ['1–3', '', 'bathrooms'], ['450', '', 'sq ft and up']],
    units: [
      { name: 'Studio', detail: 'Open plan, balcony', beds: 0, baths: 1, size: '450 sq ft', sizeAlt: '42 m²', price: 'KES 8.9M', available: 12, total: 56, plan: 'studio' },
      { name: '1 bedroom', detail: 'Balcony', beds: 1, baths: 1, size: '720 sq ft', sizeAlt: '67 m²', price: 'KES 12.5M', available: 18, total: 84, plan: '1br' },
      { name: '2 bedrooms', detail: 'Master en suite', beds: 2, baths: 2, size: '1,180 sq ft', sizeAlt: '110 m²', price: 'KES 18.9M', available: 9, total: 64, plan: '2br' },
      { name: '3 bedrooms', detail: 'All en suite, study', beds: 3, baths: 3, size: '1,850 sq ft', sizeAlt: '172 m²', price: 'KES 29.5M', available: 0, total: 20, plan: '3br' },
    ],
    construction: {
      percent: 60, stage: 'Structure topped out — facade under way', completion: 'Q2 2027',
      milestones: [['Groundbreaking', 'June 2025', 'done'], ['Foundations', 'October 2025', 'done'], ['Structure topped out', 'August 2026', 'done'], ['Facade and finishes', 'Under way', 'now'], ['Handover', 'Q2 2027', '']],
    },
    highlights: ['Sky garden on level 14', 'Studios from KES 8.9M', 'Walk to Sarit Centre'],
    amenities: ['Sky garden and lounge', 'Heated lap pool', 'Gym and yoga studio', 'Co-working lounge', 'Children’s play room', 'Three high-speed lifts', 'Backup generator', 'Borehole and water storage', 'Two basement levels of parking'],
    payment: [['20%', 'Deposit', 'on signing'], ['70%', 'Instalments', 'over 18 months'], ['10%', 'Balance', 'at handover']],
    paymentNote: 'Bank finance is available on completed units through partner lenders.',
    nearby: ['Sarit Centre — 4 minutes on foot', 'The Mall and Westgate — 6 minutes', 'Nairobi CBD — 10 minutes', 'Karura Forest — 12 minutes'],
    images: {
      cover: 'grand-tower', portrait: 'grand-tower-p',
      gallery: ['grand-living-g', 'grand-kitchen-g', 'grand-bedroom-g'],
    },
    alt: {
      'grand-tower': 'Residential tower with timber-lined balconies in the evening light',
      'grand-tower-p': 'Tall residential tower with curved balconies against a blue sky',
      'grand-living-g': 'Living room with a marble feature wall, fireplace and floor-to-ceiling windows',
      'grand-kitchen-g': 'Kitchen in dark timber with a sculptural pendant light over the counter',
      'grand-bedroom-g': 'Bedroom with a channelled headboard, brass lamps and a patterned rug',
    },
  },
  {
    slug: 'parkside-residences',
    kind: 'development',
    name: 'Parkside Residences',
    purpose: 'sale',
    type: 'Apartments',
    category: 'residential',
    location: 'kilimani',
    address: 'Argwings Kodhek Road, Kilimani, Nairobi',
    status: 'Completing 2027',
    featured: true,
    agent: 'david-mwangi',
    ref: 'PKR-03',
    intro: 'Sixty-four two- and three-bedroom apartments facing a private park in Kilimani. The building is nine-tenths complete, and handover begins in the first quarter of 2027.',
    headline: ['Nearly finished,', 'and facing the park.'],
    about: [
      'Every apartment looks over the half-acre park at the centre of the site. The two-bedroom homes have a master en suite; the three-bedroom homes add a family room and a DSQ.',
      'Because the building is almost complete, buyers can walk the show apartment, see the finishes they are paying for and move in within months.',
    ],
    price: { label: 'From KES 16.5M', num: '16.5', unit: 'M', note: 'from', from: true },
    beds: '2–3', baths: '2–3', area: '1,250–1,900', areaUnit: 'sq ft',
    facts: [['2–3', 'BR', 'bedrooms'], ['2–3', '', 'bathrooms'], ['1,250', '', 'sq ft and up']],
    units: [
      { name: '2 bedrooms', detail: 'Master en suite, park view', beds: 2, baths: 2, size: '1,250 sq ft', sizeAlt: '116 m²', price: 'KES 16.5M', available: 5, total: 36, plan: '2br' },
      { name: '3 bedrooms + DSQ', detail: 'Family room, park view', beds: 3, baths: 3, size: '1,900 sq ft', sizeAlt: '177 m²', price: 'KES 24M', available: 3, total: 28, plan: '3br' },
    ],
    construction: {
      percent: 90, stage: 'Finishes and landscaping', completion: 'Q1 2027',
      milestones: [['Groundbreaking', 'January 2025', 'done'], ['Structure', 'November 2025', 'done'], ['Facade and services', 'June 2026', 'done'], ['Finishes and landscaping', 'Under way', 'now'], ['Handover', 'Q1 2027', '']],
    },
    highlights: ['Show apartment open', 'Handover from Q1 2027', 'Half-acre private park'],
    amenities: ['Half-acre landscaped park', 'Swimming pool', 'Gym', 'Children’s play area', 'Residents’ lounge', 'Backup generator', 'Borehole', 'CCTV and controlled access', 'Two parking bays per home'],
    payment: [['30%', 'Deposit', 'on signing'], ['70%', 'Balance', 'at handover']],
    paymentNote: 'Mortgage-ready: title documents are available for lender review.',
    nearby: ['Yaya Centre — 5 minutes', 'Nairobi Arboretum — 8 minutes', 'Upper Hill — 10 minutes', 'International schools within 15 minutes'],
    images: {
      cover: 'parkside-block', portrait: 'parkside-p',
      gallery: ['parkside-living-g', 'parkside-kitchen-g', 'parkside-bedroom-g'],
    },
    alt: {
      'parkside-block': 'White apartment building rising behind mature trees',
      'parkside-p': 'Apartment building with a brick and timber top floor under a pale sky',
      'parkside-living-g': 'Open living room with a white sofa, timber feature wall and kitchen behind',
      'parkside-kitchen-g': 'Large kitchen with a grey island and three pendant lights',
      'parkside-bedroom-g': 'Bedroom with a blue feature wall and a woven pendant light',
    },
  },
  {
    slug: 'the-cove',
    kind: 'development',
    name: 'The Cove',
    purpose: 'sale',
    type: 'Villas',
    category: 'residential',
    location: 'vipingo',
    address: 'Vipingo, Kilifi County',
    status: 'Off-plan',
    featured: true,
    agent: 'amina-hassan',
    ref: 'COV-04',
    intro: 'Eighteen private villas behind a white-sand beach at Vipingo, each with its own pool and a garden that runs down to the shared beach club.',
    headline: ['Eighteen villas,', 'one beach.'],
    about: [
      'Three-, four- and five-bedroom villas set in tropical gardens, with deep shaded verandas, makuti-roofed pavilions and a private pool for every home.',
      'Owners share a beach club, a spa and a gated entrance. A rental programme is offered for owners who live elsewhere for part of the year.',
    ],
    price: { label: 'From KES 42M', num: '42', unit: 'M', note: 'from', from: true },
    beds: '3–5', baths: '3–6', area: '2,800–5,200', areaUnit: 'sq ft',
    facts: [['3–5', 'BR', 'bedrooms'], ['3–6', '', 'bathrooms'], ['2,800', '', 'sq ft and up']],
    units: [
      { name: '3-bedroom garden villa', detail: 'Private pool, ¼-acre plot', beds: 3, baths: 3, size: '2,800 sq ft', sizeAlt: '260 m²', price: 'KES 42M', available: 4, total: 8, plan: 'villa' },
      { name: '4-bedroom beach villa', detail: 'Private pool, ⅓-acre plot', beds: 4, baths: 5, size: '3,900 sq ft', sizeAlt: '362 m²', price: 'KES 65M', available: 3, total: 7, plan: 'villa' },
      { name: '5-bedroom beachfront villa', detail: 'On the sand, ½-acre plot', beds: 5, baths: 6, size: '5,200 sq ft', sizeAlt: '483 m²', price: 'KES 95M', available: 1, total: 3, plan: 'villa' },
    ],
    construction: {
      percent: 15, stage: 'Site works and the first villas’ foundations', completion: 'Q3 2028',
      milestones: [['Land and approvals', 'December 2025', 'done'], ['Groundbreaking', 'May 2026', 'done'], ['Phase 1 villas', 'Under way', 'now'], ['Beach club', '2027', ''], ['Handover', 'Q3 2028', '']],
    },
    highlights: ['A private pool for every villa', 'Beach club and spa', 'Optional rental programme'],
    amenities: ['Beach club with pool and restaurant', 'Spa and treatment rooms', 'Private pool at every villa', 'Tropical landscaped gardens', 'Gated entrance with 24/7 security', 'Solar power and backup generator', 'Borehole and desalination', 'Golf course nearby'],
    payment: [['20%', 'Deposit', 'on signing'], ['30%', 'Second payment', 'within 6 months'], ['40%', 'Instalments', 'over the build'], ['10%', 'Balance', 'at handover']],
    paymentNote: 'Diaspora buyers can sign and pay remotely; viewings are available on video.',
    nearby: ['Vipingo Ridge golf course — 10 minutes', 'Mtwapa — 20 minutes', 'Kilifi town — 30 minutes', 'Mombasa — 50 minutes'],
    images: {
      cover: 'cove-aerial', portrait: 'cove-villa-p', hero: 'cove-aerial-hero',
      gallery: ['cove-pool-g', 'cove-garden-g', 'cove-bedroom-g'],
    },
    alt: {
      'cove-aerial': 'Aerial view of villas in tropical gardens behind a white-sand beach and turquoise water',
      'cove-aerial-hero': 'Aerial view of villas in tropical gardens behind a white-sand beach and turquoise water',
      'cove-villa-p': 'Villa with a thatched roof and a lit pool among palm trees at dusk',
      'cove-pool-g': 'Pool terrace with loungers and umbrellas among tropical planting',
      'cove-garden-g': 'Villa courtyard from above: a winding pool through lush tropical garden',
      'cove-bedroom-g': 'Bedroom with floor-to-ceiling glass opening onto a terrace and the water',
    },
  },

  /* ---------------- properties ---------------- */
  {
    slug: 'ocean-house',
    kind: 'property',
    name: 'Ocean House',
    purpose: 'sale',
    type: 'Villa',
    category: 'residential',
    location: 'diani',
    address: 'Beach Road, Diani, Kwale County',
    status: 'For sale',
    featured: true,
    agent: 'amina-hassan',
    ref: 'OH-1042',
    intro: 'A five-bedroom contemporary villa with an infinity pool, set back from the beach in Diani on three-quarters of an acre.',
    headline: ['Five bedrooms,', 'the Indian Ocean in front.'],
    about: [
      'The ground floor opens entirely onto the pool terrace: a double-height living room, a dining room for twelve and a kitchen with a separate scullery. All five bedrooms are en suite, four of them with sea views.',
      'The villa is finished, furnished and ready to occupy. It comes with a two-bedroom staff cottage, a borehole and solar power.',
    ],
    price: { label: 'KES 165M', num: '165', unit: 'M', note: 'asking price' },
    beds: '5', baths: '6', area: '6,400', areaUnit: 'sq ft',
    facts: [['5', 'BR', 'bedrooms'], ['6', '', 'bathrooms'], ['6,400', '', 'sq ft']],
    plot: '0.75 acres', tenure: 'Freehold', year: 'Completed 2024', furnished: 'Furnished',
    features: ['Infinity pool facing the sea', 'Double-height living room', 'Five en suite bedrooms', 'Kitchen with scullery and pantry', 'Two-bedroom staff cottage', 'Solar power and borehole', 'Landscaped, walled garden', 'Parking for four cars'],
    nearby: ['Diani beach — 2 minutes on foot', 'Ukunda airstrip — 10 minutes', 'Diani shopping centres — 8 minutes', 'Mombasa via the Dongo Kundu bypass — 60 minutes'],
    images: {
      cover: 'ocean-villa', portrait: 'ocean-villa-p',
      gallery: ['ocean-pool-g', 'ocean-living-g', 'ocean-view-g', 'ocean-bath-g'],
    },
    alt: {
      'ocean-villa': 'White contemporary villa with a pool and lawn under a clear sky',
      'ocean-villa-p': 'White contemporary villa beside its pool',
      'ocean-pool-g': 'Infinity pool overlooking a bay and the open sea',
      'ocean-living-g': 'Bright double-height living room with a fireplace and gallery above',
      'ocean-view-g': 'The sea through an arched opening above a white balustrade',
      'ocean-bath-g': 'Marble bathroom with twin basins, round mirrors and brass taps',
    },
  },
  {
    slug: 'palm-court',
    kind: 'property',
    name: 'Palm Court',
    purpose: 'rent',
    type: 'House',
    category: 'residential',
    location: 'lavington',
    address: 'James Gichuru Road, Lavington, Nairobi',
    status: 'To let',
    featured: true,
    agent: 'grace-wanjiru',
    ref: 'PC-2087',
    intro: 'A four-bedroom architect-designed house in a private Lavington compound, around a mature garden and a century-old tree.',
    headline: ['A garden house,', 'ten minutes from Westlands.'],
    about: [
      'The living spaces open fully onto the garden through sliding glass walls. Upstairs, four bedrooms (three en suite) and a family room look into the tree canopy.',
      'Available unfurnished from 1 December on a two-year lease. The garden and pool are maintained by the landlord.',
    ],
    price: { label: 'KES 450K / month', num: '450', unit: 'K', note: 'per month' },
    beds: '4', baths: '4', area: '4,200', areaUnit: 'sq ft',
    facts: [['4', 'BR', 'bedrooms'], ['4', '', 'bathrooms'], ['4,200', '', 'sq ft']],
    plot: '0.5 acres', tenure: 'Two-year lease', year: 'Available 1 December', furnished: 'Unfurnished',
    features: ['Sliding glass walls onto the garden', 'Four bedrooms, three en suite', 'Upstairs family room', 'Study', 'Two-bedroom DSQ', 'Garden and pool maintained', 'Borehole and backup generator', 'Gated compound with guards'],
    nearby: ['Lavington Mall — 4 minutes', 'Westlands — 10 minutes', 'International schools — 5 to 15 minutes', 'Nairobi CBD — 20 minutes'],
    images: {
      cover: 'palm-house', portrait: 'palm-house-p',
      gallery: ['palm-garden-g', 'palm-living-g', 'palm-bedroom-g'],
    },
    alt: {
      'palm-house': 'Timber and dark-clad modern house lit at dusk around a lawn and a large tree',
      'palm-house-p': 'Modern house lit at dusk beneath a large tree',
      'palm-garden-g': 'Modern house with timber cladding and a lawn under a mature tree',
      'palm-living-g': 'Living room with a grey sofa, leather pouffes and a long clerestory window',
      'palm-bedroom-g': 'Bedroom with an upholstered headboard and a padded bench at the foot of the bed',
    },
  },
  {
    slug: 'the-atrium',
    kind: 'property',
    name: 'The Atrium',
    purpose: 'rent',
    type: 'Office space',
    category: 'commercial',
    location: 'upper-hill',
    address: 'Upper Hill Road, Nairobi',
    status: 'To let',
    featured: true,
    agent: 'brian-otieno',
    ref: 'ATR-3011',
    intro: 'Grade A office floors around a four-storey daylit atrium in Upper Hill, from a 2,500 sq ft suite to a whole 12,000 sq ft floor.',
    headline: ['Grade A offices,', 'built around the light.'],
    about: [
      'Each floor plate wraps the central atrium, so every desk is within ten metres of natural light. Floors are delivered with raised access flooring, air conditioning and fibre to the riser.',
      'Tenants share a reception, meeting suites and a café in the atrium, with 1:250 sq ft parking in the basement.',
    ],
    price: { label: 'KES 140 / sq ft / month', num: '140', unit: '', pre: 'KES', note: 'per sq ft, monthly' },
    area: '2,500–12,000', areaUnit: 'sq ft',
    facts: [['2,500', '', 'sq ft, smallest suite'], ['12,000', '', 'sq ft, full floor'], ['A', '', 'grade']],
    spec: [['12,000', '', 'sq ft, suites from 2,500'], ['1:250', '', 'parking ratio']],
    tenure: 'Leases from 3 years', year: 'Completed 2023', furnished: 'Shell or fitted',
    features: ['Four-storey daylit atrium', 'Raised access floors', 'VRF air conditioning', 'Fibre from two providers', '100% backup power', 'Shared meeting suites', 'Atrium café', 'Basement parking, 1 bay per 250 sq ft'],
    nearby: ['Hospital Hill and the medical district — 3 minutes', 'Nairobi CBD — 8 minutes', 'Mombasa Road and the expressway — 10 minutes', 'Kilimani — 6 minutes'],
    images: {
      cover: 'atrium-facade', portrait: 'atrium-tower-p',
      gallery: ['atrium-hall-g', 'atrium-floor-g', 'atrium-meeting-g'],
    },
    alt: {
      'atrium-facade': 'Curved glass facade of an office building against a pale blue sky',
      'atrium-tower-p': 'Glass office building lit from within against a deep blue evening sky',
      'atrium-hall-g': 'Daylit atrium with a glazed staircase and potted plants',
      'atrium-floor-g': 'Long office corridor with glass partitions and a pale floor',
      'atrium-meeting-g': 'Open office floor with floor-to-ceiling windows and a meeting table',
    },
  },
  {
    slug: 'creekside-land-kilifi',
    kind: 'property',
    name: 'Creekside Land',
    purpose: 'sale',
    type: 'Land',
    category: 'land',
    location: 'kilifi',
    address: 'Off the Malindi Road, Kilifi Creek',
    status: 'For sale',
    featured: true,
    agent: 'amina-hassan',
    ref: 'KLF-4120',
    intro: 'Two acres of level, freehold land a short walk from Kilifi Creek, zoned for residential or boutique hospitality use.',
    headline: ['Two acres,', 'a walk from the creek.'],
    about: [
      'The plot is level, fenced and planted with mature coconut palms along its eastern boundary. Power and water run along the access road.',
      'Zoning allows residential or low-density hospitality development. A title search and survey are available to serious buyers.',
    ],
    price: { label: 'KES 28M', num: '28', unit: 'M', note: 'asking price' },
    area: '2', areaUnit: 'acres',
    facts: [['2', '', 'acres'], ['Freehold', '', 'title'], ['Level', '', 'ground']],
    spec: [['2', '', 'acres, level'], ['Freehold', '', 'clean title']],
    plot: '2 acres', tenure: 'Freehold', year: 'Survey available', furnished: null,
    features: ['Level, fenced plot', 'Freehold title, search available', 'Mature coconut palms', 'Power on the access road', 'Piped water connection', 'Residential or hospitality zoning', 'Murram access road', 'Five minutes to the creek'],
    nearby: ['Kilifi Creek — 5 minutes on foot', 'Kilifi town — 10 minutes', 'Vipingo — 25 minutes', 'Malindi — 50 minutes'],
    images: {
      cover: 'land-palms', portrait: 'land-palms-p',
      gallery: ['land-palms-g', 'land-aerial-g', 'land-forest-g'],
    },
    alt: {
      'land-palms': 'Open green land edged by a line of coconut palms',
      'land-palms-p': 'Open green land edged by coconut palms',
      'land-palms-g': 'Open green land edged by a line of coconut palms',
      'land-aerial-g': 'Aerial view of grassland scattered with palm trees and a footpath',
      'land-forest-g': 'Aerial view of woodland with open clearings at dawn',
    },
  },
  {
    slug: 'riverside-penthouse',
    kind: 'property',
    name: 'Riverside Penthouse',
    purpose: 'sale',
    type: 'Penthouse',
    category: 'residential',
    location: 'westlands',
    address: 'Riverside Drive, Westlands, Nairobi',
    status: 'For sale',
    featured: true,
    agent: 'brian-otieno',
    ref: 'RVP-1077',
    intro: 'A four-bedroom penthouse across the top floor of a boutique Riverside Drive building, with a private roof terrace and views to the Ngong Hills.',
    headline: ['The whole top floor,', 'and the roof above it.'],
    about: [
      'A private lift opens into a 30-metre living and dining room glazed on three sides. All four bedrooms are en suite; the main suite has a dressing room and its own terrace.',
      'Stairs lead up to a roof terrace with an outdoor kitchen. The sale includes three parking bays and a storeroom.',
    ],
    price: { label: 'KES 78M', num: '78', unit: 'M', note: 'asking price' },
    beds: '4', baths: '5', area: '4,600', areaUnit: 'sq ft',
    facts: [['4', 'BR', 'bedrooms'], ['5', '', 'bathrooms'], ['4,600', '', 'sq ft']],
    tenure: 'Leasehold, 99 years', year: 'Completed 2022', furnished: 'Unfurnished',
    features: ['Private lift lobby', 'Living room glazed on three sides', 'Four en suite bedrooms', 'Main suite with dressing room', 'Private roof terrace with outdoor kitchen', 'Three parking bays', 'Gym and pool in the building', 'Backup generator and borehole'],
    nearby: ['Westlands — 5 minutes', 'Sarit Centre — 7 minutes', 'Nairobi CBD — 12 minutes', 'Karura Forest — 10 minutes'],
    images: {
      cover: 'riverside-tower',
      gallery: ['riverside-lounge-g', 'riverside-dining-g', 'riverside-bedroom-g'],
    },
    alt: {
      'riverside-tower': 'Corner of a contemporary apartment building with dark cladding against a blue sky',
      'riverside-lounge-g': 'Sunlit living room with leather sofas and a gallery wall of framed prints',
      'riverside-dining-g': 'Open-plan dining area with a glass staircase and tall windows',
      'riverside-bedroom-g': 'Bedroom suite with fitted wardrobes, brass details and a seating area',
    },
  },
  {
    slug: 'the-linden-kilimani',
    kind: 'property',
    name: 'The Linden, Apartment 4B',
    purpose: 'rent',
    type: 'Apartment',
    category: 'residential',
    location: 'kilimani',
    address: 'Lenana Road, Kilimani, Nairobi',
    status: 'To let',
    featured: true,
    agent: 'grace-wanjiru',
    ref: 'LDN-2140',
    intro: 'A furnished two-bedroom apartment on the fourth floor of a quiet, garden-set block in Kilimani, ready to move into.',
    headline: ['Furnished, quiet,', 'and ready now.'],
    about: [
      'An open living and dining room leads to a balcony over the gardens. The kitchen is fully fitted, and both bedrooms have built-in wardrobes; the main bedroom is en suite.',
      'Rent includes the service charge, Wi-Fi and one parking bay. A minimum lease of twelve months applies.',
    ],
    price: { label: 'KES 120K / month', num: '120', unit: 'K', note: 'per month' },
    beds: '2', baths: '2', area: '1,100', areaUnit: 'sq ft',
    facts: [['2', 'BR', 'bedrooms'], ['2', '', 'bathrooms'], ['1,100', '', 'sq ft']],
    tenure: '12-month lease', year: 'Available now', furnished: 'Furnished',
    features: ['Fully furnished', 'Balcony over the gardens', 'Main bedroom en suite', 'Fitted kitchen', 'Wi-Fi and service charge included', 'One parking bay', 'Lift and backup generator', 'Pool and gym in the compound'],
    nearby: ['Yaya Centre — 5 minutes', 'Kilimani and Lavington schools — 5 to 10 minutes', 'Nairobi Hospital — 8 minutes', 'Nairobi CBD — 15 minutes'],
    images: {
      cover: 'linden-block', portrait: 'linden-living-p',
      gallery: ['linden-living-g', 'linden-kitchen-g', 'linden-bedroom-g'],
    },
    alt: {
      'linden-block': 'Cream apartment block among palms and flowering gardens',
      'linden-living-p': 'Bright living room with a red armchair and tall windows',
      'linden-living-g': 'Bright open-plan living and dining room with a red armchair',
      'linden-kitchen-g': 'White kitchen with stainless steel appliances and black bar stools',
      'linden-bedroom-g': 'Bedroom with grey linen, patterned cushions and a bedside lamp',
    },
  },
];

/* ---------- helpers ---------- */
export const agentOf = (l) => AGENTS.find((a) => a.slug === l.agent);
export const listingsOf = (a) => LISTINGS.filter((l) => l.agent === a.slug);
export const count = (loc) => LISTINGS.filter((l) => l.location === loc).length;
export const DEVELOPMENTS = LISTINGS.filter((l) => l.kind === 'development');
export const PROPERTIES = LISTINGS.filter((l) => l.kind === 'property');

/* Page titles and descriptions for the hand-written pages (generated into their <head>). */
export const PAGES = {
  'index.html': { title: `${BRAND.name} — Properties for Sale, Rent & New Developments`, description: BRAND.summary },
  'properties.html': { title: `Properties for Sale and to Let | ${BRAND.name}`, description: `Homes, apartments, villas, land and office space for sale and to let in Nairobi and on the Kenyan coast, from ${BRAND.name}.` },
  'developments.html': { title: `New Developments | ${BRAND.name}`, description: `New and off-plan developments in Nairobi and on the coast: unit availability, floor plans, construction progress and payment plans.` },
  'agents.html': { title: `Our Team | ${BRAND.name}`, description: `Meet the consultants at ${BRAND.name}: sales, new developments, lettings, property management and commercial property.` },
  'contact.html': { title: `Contact | ${BRAND.name}`, description: `Call, WhatsApp or email ${BRAND.name} to book a viewing, ask about a property or development, or sell, let or manage your property.` },
};
