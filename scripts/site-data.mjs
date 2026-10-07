/* Blu Real Estate — every listing on the site, with the figures Blu published.
 *
 * SOURCE RULE: each value below comes from Blu Real Estate's own Instagram (@blurealestate.ke),
 * either a post caption or the price panel printed on a slide of the same post. The post and its
 * date travel with the listing and are printed on its page. Nothing here is estimated: where Blu
 * gave no price, the listing says so. Where a caption and a slide disagree, the caption wins and
 * the disagreement is logged in brand_assets/blu-source/PROVENANCE.md.
 *
 * NAMES: Blu's posts mostly describe a development rather than name it. A listing carries a
 * proper name only where Blu itself published one (Emaar Apartments: its flyer; Wavecrest
 * Residency: its TikTok, and the developer watermark on the render it posted). The rest use
 * the headline Blu gave them in its 6 June 2026 round-up post.
 *
 * IMAGES: developers' renders that Blu posted, cropped clear of every overlay by
 * optimize-images.mjs. They are artist's impressions of buildings that are mostly not built
 * yet, and every alt text says so. */

export const PHONE = '+254 740 777 888';
export const PHONE_TEL = '+254740777888';
export const WA = '254740777888';
export const INSTAGRAM = 'https://www.instagram.com/blurealestate.ke/';
export const TIKTOK = 'https://www.tiktok.com/@blurealestate.ke';
export const THREADS = 'https://www.threads.com/@blurealestate.ke';

export const waLink = (text) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;

const ig = (code) => `https://www.instagram.com/blurealestate.ke/p/${code}/`;

/* spec: the flyer panel — beds (+ DSQ), the headline size, and the price in KES millions.
   Each mirrors the panel Blu printed on the listing's own flyer, unless the caption says otherwise
   (see PROVENANCE.md). */

/* Image helper: slug + the widths optimize-images.mjs wrote for it. */
const img = (slug, widths, w, h, alt) => ({ slug, widths, w, h, alt });

export const AREAS = {
  nyali: { label: 'Nyali', blurb: 'North of the island: Links Road, 2nd Avenue and the beach hotels.' },
  kizingo: { label: 'Kizingo', blurb: 'On Mombasa Island, above the southern shore.' },
  stadium: { label: 'Stadium', blurb: 'Between the island and Nyali, near the city centre.' },
};

/* Payment schedules, worded as each listing's own post words them. (Blu's 6 June round-up post
   says "10% on Handover" in general; the two listings that publish a schedule say otherwise.) */
const PAY_SKYLINE = [
  ['30%', 'Initial deposit', 'first'],
  ['30%', 'Second payment', 'within 6 months'],
  ['30%', 'Third payment', 'over the next 6 months'],
  ['10%', 'Final instalment', 'last'],
];
const PAY_KIZINGO = [
  ['30%', 'Initial deposit', 'first'],
  ['30%', 'Second payment', 'over the next 6 months'],
  ['30%', 'Third payment', 'over the 6 months after'],
  ['10%', 'Final payment', 'over the last 6 months'],
];

export const LISTINGS = [
  {
    slug: 'award-winning-skyline',
    name: 'Award-Winning Skyline',
    area: 'nyali',
    location: 'Off Links Road, near Nyali Golf Club',
    status: 'Off-plan',
    intro: 'Two- and three-bedroom apartments off Links Road in Nyali, with ocean and golf-club views and a padel court up on the roof.',
    headline: ['Ocean and golf views,', 'a padel court on the roof.'],
    about: [
      'Every bedroom is en suite. The three-bedroom homes add a DSQ, in two sizes: 214 and 224 square metres.',
      'Blu lists the building as a winner at the Luxury Lifestyle Awards 2025. It is sold on a four-stage payment plan, set out below.',
    ],
    spec: { beds: '2 & 3', dsq: false, size: '1,507', sizeNote: 'sq ft and up', price: '12', priceNote: 'from' },
    fromPrice: 'KES 12M',
    units: [
      { name: '2 bedrooms', detail: 'All en suite', size: '140 m²', sizeAlt: '1,507 sq ft', price: 'KES 12M' },
      { name: '3 bedrooms + DSQ', detail: 'All en suite', size: '214 m²', sizeAlt: '2,303 sq ft', price: 'KES 14M' },
      { name: '3 bedrooms + DSQ', detail: 'All en suite, larger plan', size: '224 m²', sizeAlt: '2,411 sq ft', price: 'KES 16M' },
    ],
    highlights: ['Sky padel court', 'Luxury Lifestyle Awards 2025 winner, as Blu lists it', 'Ocean and golf-club views'],
    amenities: ['Swimming pool', 'BBQ area', 'Separate gyms for men and women', 'Children’s play area', '24/7 security and CCTV', 'Backup generator', 'Borehole'],
    payment: PAY_SKYLINE,
    paymentNote: 'As set out in Blu’s post of 15 July 2026.',
    nearby: null,
    source: { date: '15 July 2026', url: ig('Da0DjiYIVZL'), also: { date: '5 June 2026', url: ig('DZNF0bPCO25') } },
    images: {
      cover: img('skyline-facade', [640, 1080], 1080, 720, 'Artist’s impression of the Award-Winning Skyline apartments in Nyali at dusk — the developer’s render, posted by Blu Real Estate'),
      portrait: img('skyline-tower', [520], 520, 830, 'Artist’s impression of the Award-Winning Skyline tower in Nyali — the developer’s render, posted by Blu Real Estate'),
      gallery: [
        img('skyline-living', [640, 1080], 1080, 830, 'Artist’s impression of a living room at Award-Winning Skyline — developer’s render'),
        img('skyline-kitchen', [640, 1080], 1080, 920, 'Artist’s impression of a kitchen at Award-Winning Skyline — developer’s render'),
        img('skyline-facade', [640, 1080], 1080, 720, 'Artist’s impression of the Award-Winning Skyline building — developer’s render'),
      ],
    },
  },
  {
    slug: 'home-to-modern-luxury',
    name: 'Home to Modern Luxury',
    area: 'nyali',
    location: 'Off Links Road and Baobab Road, Nyali',
    status: 'Off-plan',
    intro: 'Seventy-two flat-roofed homes near the Nyali beaches: coral stone, timber screens and wide glass, set around a planted central courtyard.',
    headline: ['Seventy-two homes', 'around a green core.'],
    about: [
      'Every home has its own en suite DSQ. The plans run from a 1,948 sq ft two-bedroom to a 4,036 sq ft four-bedroom penthouse, with open kitchens that open onto outdoor dining terraces.',
      'The development has separate pools and separate gyms for women and men, a mezzanine lounge, a cafeteria and a prayer room.',
    ],
    spec: { beds: '2–4', dsq: true, size: '1,948', sizeNote: 'to 4,036 sq ft', price: '18', priceNote: 'from' },
    fromPrice: 'KES 18M',
    units: [
      { name: '2 bedrooms + DSQ', detail: 'En suite DSQ', size: '1,948 sq ft', sizeAlt: '181 m²', price: 'KES 18M' },
      { name: '3 bedrooms + DSQ', detail: 'En suite DSQ', size: '2,518 sq ft', sizeAlt: '234 m²', price: 'KES 25M' },
      { name: '4 bedrooms + DSQ', detail: 'En suite DSQ', size: '3,627 sq ft', sizeAlt: '337 m²', price: 'KES 30M' },
      { name: '4-bedroom penthouse', detail: 'Top floor', size: '4,036 sq ft', sizeAlt: '375 m²', price: 'KES 35M' },
    ],
    highlights: ['72 homes in total', 'Coral stone, timber screens and glass', 'Two-floor atrium and central courtyard'],
    amenities: ['Separate pools for women and men', 'Separate gyms', 'Central landscaped courtyard', 'Mezzanine lounge', 'Cafeteria', 'Prayer room', 'High-speed lifts', 'Steady water supply', '24-hour security', 'Gated, with ample parking'],
    payment: null,
    paymentNote: null,
    nearby: ['Minutes from the Nyali beaches', 'Near Nyali’s shopping centres and restaurants', 'Close to schools'],
    source: { date: '6 June 2026', url: ig('DZPfbKSiNt_') },
    images: {
      cover: img('modern-aerial', [640, 1080], 1080, 510, 'Artist’s impression of Home to Modern Luxury from above: low flat-roofed blocks around a courtyard — the developer’s render, posted by Blu Real Estate'),
      portrait: img('modern-front', [610], 610, 740, 'Artist’s impression of a Home to Modern Luxury block, timber-clad, at dusk — the developer’s render, posted by Blu Real Estate'),
      gallery: [
        img('modern-dining', [640, 1080], 1080, 920, 'Artist’s impression of an open-plan dining and living room at Home to Modern Luxury — developer’s render'),
        img('modern-kitchen', [640, 1080], 1080, 920, 'Artist’s impression of a kitchen at Home to Modern Luxury — developer’s render'),
        img('modern-bedroom', [640, 1080], 1080, 920, 'Artist’s impression of a bedroom at Home to Modern Luxury — developer’s render'),
      ],
    },
  },
  {
    slug: 'modern-luxury-living',
    name: 'Modern Luxury Living',
    area: 'nyali',
    location: 'Nyali, Mombasa',
    status: 'Off-plan',
    intro: 'A new residential tower in Nyali with two- and three-bedroom apartments and four-bedroom duplexes, built over 36 months.',
    headline: ['Apartments and duplexes,', 'built over 36 months.'],
    about: [
      'The largest homes are four-bedroom duplexes of 4,520 sq ft. Two- and three-bedroom apartments start at 1,876 and 2,814 sq ft.',
      'Blu publishes two discounts: KES 500,000 off for a cash purchase and KES 250,000 off for a 50% deposit. Otherwise it is 30% down and the balance over 36 months.',
    ],
    spec: { beds: '2–4', dsq: false, size: '1,876', sizeNote: 'to 4,520 sq ft', price: '12', priceNote: 'from' },
    fromPrice: 'KES 12M',
    units: [
      { name: '2 bedrooms', detail: 'Apartment', size: '1,876 sq ft', sizeAlt: '174 m²', price: 'From KES 12M' },
      { name: '3 bedrooms', detail: 'Apartment', size: '2,814 sq ft', sizeAlt: '261 m²', price: 'From KES 16M' },
      { name: '4-bedroom duplex', detail: 'Two floors', size: '4,520 sq ft', sizeAlt: '419.9 m²', price: 'KES 30M' },
    ],
    highlights: ['KES 500,000 off for cash', 'KES 250,000 off for a 50% deposit', '36-month build and payment period'],
    amenities: null,
    payment: [
      ['30%', 'Deposit', 'on signing'],
      ['70%', 'Balance', 'over 36 months'],
    ],
    paymentNote: 'Or pay cash for KES 500,000 off, or put down 50% for KES 250,000 off.',
    paymentSummary: '30% down, the rest over 36 months',
    nearby: null,
    source: { date: '5 June 2026', url: ig('DZNPgyRCLut') },
    images: {
      cover: img('living-tower', [640, 1080], 1080, 670, 'Artist’s impression of the Modern Luxury Living tower in Nyali at sunset — the developer’s render, posted by Blu Real Estate'),
      portrait: img('living-tower-p', [560], 560, 670, 'Artist’s impression of the Modern Luxury Living tower in Nyali — the developer’s render, posted by Blu Real Estate'),
      gallery: [
        img('living-lounge', [640, 1080], 1080, 920, 'Artist’s impression of a living room at Modern Luxury Living — developer’s render'),
        img('living-dining', [640, 1080], 1080, 920, 'Artist’s impression of a dining room at Modern Luxury Living — developer’s render'),
        img('living-kitchen', [640, 1080], 1080, 920, 'Artist’s impression of a kitchen at Modern Luxury Living — developer’s render'),
        img('living-bedroom', [640, 1080], 1080, 920, 'Artist’s impression of a bedroom at Modern Luxury Living — developer’s render'),
      ],
    },
  },
  {
    slug: 'unrivaled-luxury-apartments',
    name: 'Unrivaled Luxury Apartments',
    area: 'nyali',
    location: 'Nyali, near Nyali Golf & Country Club',
    status: 'Off-plan',
    intro: 'The largest homes Blu lists in Nyali: three- to five-bedroom apartments, each with a DSQ, from 3,500 sq ft.',
    headline: ['Three to five bedrooms,', 'each with a DSQ.'],
    about: [
      'Each home has two kitchens, a main kitchen and a working one, plus smart-home features. Security uses automatic number-plate recognition.',
      'Shared spaces include separate pools for women and men, a gym, yoga studio and sauna, a café, a roof terrace and landscaped gardens.',
    ],
    spec: { beds: '3–5', dsq: true, size: '3,500', sizeNote: 'to 5,000 sq ft', price: '21', priceNote: 'from' },
    fromPrice: 'KES 21M',
    units: [
      { name: '3 bedrooms + DSQ', detail: 'Main and working kitchens', size: '3,500 sq ft', sizeAlt: '325 m²', price: 'From KES 21M' },
      { name: '4 bedrooms + DSQ', detail: 'Main and working kitchens', size: '4,200 sq ft', sizeAlt: '390 m²', price: 'From KES 26M' },
      { name: '5 bedrooms + DSQ', detail: 'Main and working kitchens', size: '5,000 sq ft', sizeAlt: '465 m²', price: 'From KES 29M' },
    ],
    highlights: ['Main kitchen plus a working kitchen', 'Smart-home features', 'Automatic number-plate recognition'],
    amenities: ['Separate pools for women and men', 'Gym, yoga studio and sauna', 'In-house café', 'Roof terrace', 'Landscaped gardens', 'Children’s play area', 'Full power backup', 'Borehole water'],
    payment: null,
    paymentNote: null,
    nearby: ['English Point Marina and the Tamarind Dhow', 'Nyali Golf & Country Club', 'Chandarana Foodplus and The Promenade', 'Oshwal, Mombasa Academy and Light International School'],
    nearbyNote: 'Blu puts all of these within ten minutes.',
    source: { date: '5 June 2026', url: ig('DZNNQJsiBBX') },
    images: {
      cover: img('unrivaled-towers', [640, 1080], 1080, 730, 'Artist’s impression of the Unrivaled Luxury Apartments towers in Nyali — the developer’s render, posted by Blu Real Estate'),
      portrait: img('unrivaled-tower-p', [430], 430, 770, 'Artist’s impression of an Unrivaled Luxury Apartments tower in Nyali — the developer’s render, posted by Blu Real Estate'),
      gallery: [
        img('unrivaled-lounge', [640, 1080], 1080, 840, 'Artist’s impression of a lounge at Unrivaled Luxury Apartments — developer’s render'),
        img('unrivaled-dining', [640, 1080], 1080, 840, 'Artist’s impression of a dining room at Unrivaled Luxury Apartments — developer’s render'),
        img('unrivaled-towers', [640, 1080], 1080, 730, 'Artist’s impression of the Unrivaled Luxury Apartments towers — developer’s render'),
      ],
    },
  },
  {
    slug: 'seaside-elegance',
    name: 'Seaside Elegance',
    area: 'nyali',
    location: 'Nyali, a walk from Voyager Beach Resort',
    status: 'Off-plan',
    intro: 'An oceanfront block in Nyali with only two apartments to a floor. Every home has three en suite bedrooms and an en suite DSQ, in about 3,000 sq ft.',
    headline: ['Two homes a floor,', 'the ocean in front.'],
    about: [
      'The top floor is a duplex with panoramic ocean views. The building has a padel court, a pool with a sunken lounge, a gym overlooking the pool and a mosque for women and men.',
      'Blu’s post of 5 June 2026 gave February 2026 for groundbreaking, a pre-groundbreaking price from KES 17M and payment plans that include 0% interest options.',
    ],
    spec: { beds: '3', dsq: true, size: '3,000', sizeNote: 'square feet', price: '17', priceNote: 'from' },
    fromPrice: 'KES 17M',
    units: [
      { name: '3 bedrooms + DSQ', detail: 'All en suite, two homes per floor', size: '3,000 sq ft', sizeAlt: '279 m²', price: 'From KES 17M' },
      { name: 'Top-floor duplex', detail: 'Panoramic ocean views', size: 'Ask Blu', sizeAlt: '', price: 'Ask Blu' },
    ],
    highlights: ['Two apartments per floor', 'Two parking spaces per home', 'Payment plans with 0% interest options'],
    amenities: ['Padel court', 'Pool with a sunken lounge', 'Gym overlooking the pool', 'Reception, visitor lounge and coffee corner', 'Mosque for women and men', 'Card-key access and 24/7 security', 'Two parking spaces per home', 'Dhobi area', 'Backup generator'],
    payment: null,
    paymentNote: null,
    paymentSummary: 'Flexible, with 0% interest options',
    paymentText: 'Blu’s post lists flexible payment plans, including 0% interest options, but no schedule. Ask Blu for the one that applies.',
    nearby: ['Voyager Beach Resort, within walking distance', 'Restaurants and shopping malls nearby'],
    source: { date: '5 June 2026', url: ig('DZNCLtLCHtu') },
    images: {
      cover: img('seaside-aerial', [640, 1080], 1080, 625, 'Artist’s impression of Seaside Elegance from above, near the beach in Nyali — the developer’s render, posted by Blu Real Estate'),
      portrait: img('seaside-tower', [520], 520, 845, 'Artist’s impression of the Seaside Elegance tower in Nyali at dusk — the developer’s render, posted by Blu Real Estate'),
      gallery: [
        img('seaside-living', [640, 1080], 1080, 920, 'Artist’s impression of a living room at Seaside Elegance — developer’s render'),
        img('seaside-dining', [640, 1080], 1080, 920, 'Artist’s impression of a dining room with a sea view at Seaside Elegance — developer’s render'),
        img('seaside-kitchen', [640, 1080], 1080, 920, 'Artist’s impression of a kitchen at Seaside Elegance — developer’s render'),
      ],
    },
  },
  {
    slug: 'wavecrest-residency',
    name: 'Wavecrest Residency',
    area: 'nyali',
    location: '2nd Avenue, Nyali',
    status: 'Off-plan',
    intro: 'Ocean-view apartments on 2nd Avenue in Nyali, from one bedroom to four, with an infinity pool and a roof terrace. Blu calls it “the pinnacle of luxury living on 2nd Avenue”.',
    headline: ['On 2nd Avenue,', 'with a pool on the roof.'],
    about: [
      'The building offers one- and two-bedroom apartments, and three- and four-bedroom apartments with a DSQ. Blu lists the three-bedroom at 2,850 sq ft for KES 16M; for the other sizes, ask for the current price.',
      'At the top are an infinity pool facing the sea, a sky-view gym and a roof terrace. At ground level there are gardens with cascading water.',
    ],
    spec: { beds: '3', dsq: true, size: '2,850', sizeNote: 'square feet', price: '16', priceNote: '3-bed price' },
    fromPrice: 'KES 16M (3 BR)',
    units: [
      { name: '1 bedroom', detail: 'Ocean-view apartment', size: 'Ask Blu', sizeAlt: '', price: 'Ask Blu' },
      { name: '2 bedrooms', detail: 'Ocean-view apartment', size: 'Ask Blu', sizeAlt: '', price: 'Ask Blu' },
      { name: '3 bedrooms + DSQ', detail: 'Ocean-view apartment', size: '2,850 sq ft', sizeAlt: '265 m²', price: 'KES 16M' },
      { name: '4 bedrooms + DSQ', detail: 'Ocean-view apartment', size: 'Ask Blu', sizeAlt: '', price: 'Ask Blu' },
    ],
    highlights: ['Infinity pool with ocean views', 'Sky-view gym', 'Roof terrace'],
    amenities: ['Infinity pool', 'Sky-view gym', 'Roof entertainment terrace', 'Gardens and cascading water features', '24/7 security', 'Ample parking', 'Backup generator'],
    payment: null,
    paymentNote: null,
    nearby: null,
    source: { date: '25 March 2026', url: ig('DWTfSipCKJF') },
    images: {
      cover: img('wavecrest-aerial', [640, 1080], 1080, 735, 'Artist’s impression of Wavecrest Residency on 2nd Avenue, Nyali, from above — the developer’s render, posted by Blu Real Estate'),
      portrait: img('wavecrest-aerial', [640, 1080], 1080, 735, 'Artist’s impression of Wavecrest Residency on 2nd Avenue, Nyali — the developer’s render, posted by Blu Real Estate'),
      hero: img('wavecrest-hero', [768, 1152, 1536, 1920], 1920, 866, 'Artist’s impression of Wavecrest Residency above the beach on 2nd Avenue, Nyali — the developer’s render, posted by Blu Real Estate'),
      gallery: [
        img('wavecrest-living', [640, 1080], 1080, 920, 'Artist’s impression of a living room facing the sea at Wavecrest Residency — developer’s render'),
        img('wavecrest-dining', [640, 1080], 1080, 920, 'Artist’s impression of a dining room at Wavecrest Residency — developer’s render'),
        img('wavecrest-kitchen', [640, 1080], 1080, 920, 'Artist’s impression of a kitchen at Wavecrest Residency — developer’s render'),
      ],
    },
  },
  {
    slug: 'family-residential-resort-kizingo',
    name: 'Family Residential Resort',
    area: 'kizingo',
    location: 'Kizingo, Mombasa Island',
    status: 'Off-plan',
    intro: 'A gated, 14-floor block in Kizingo built for families: three- and four-bedroom apartments, each with a DSQ, and a pool on the roof.',
    headline: ['Fourteen floors,', 'built for families.'],
    about: [
      'The three-bedroom plan is 265 square metres and the four-bedroom 315. Blu advertises them from KES 15M.',
      'Inside the gates are a rooftop pool, separate gyms for women and men, a steam room and sauna, an indoor play area for children and an outdoor barbecue area.',
    ],
    spec: { beds: '3 & 4', dsq: true, size: '2,852', sizeNote: 'to 3,390 sq ft', price: '15', priceNote: 'from' },
    fromPrice: 'KES 15M',
    units: [
      { name: '3 bedrooms + DSQ', detail: 'Family plan', size: '265 m²', sizeAlt: '2,852 sq ft', price: 'From KES 15M' },
      { name: '4 bedrooms + DSQ', detail: 'Family plan', size: '315 m²', sizeAlt: '3,390 sq ft', price: 'Ask Blu' },
    ],
    highlights: ['14 floors, gated', 'Rooftop pool', 'Indoor children’s play area'],
    amenities: ['Rooftop swimming pool', 'Separate gyms for women and men', 'Steam room and sauna', 'Indoor children’s play area', 'Outdoor barbecue area', '24/7 security and CCTV', 'Backup generator', 'Borehole'],
    payment: PAY_KIZINGO,
    paymentNote: 'As set out in Blu’s post of 24 March 2026.',
    nearby: null,
    source: { date: '24 March 2026', url: ig('DWRNiLGiG-V') },
    images: {
      cover: img('kizingo-tower', [640, 1080], 1080, 755, 'Artist’s impression of the Family Residential Resort tower in Kizingo — the developer’s render, posted by Blu Real Estate'),
      portrait: img('kizingo-tower-p', [620], 620, 755, 'Artist’s impression of the Family Residential Resort tower in Kizingo — the developer’s render, posted by Blu Real Estate'),
      gallery: [
        img('kizingo-living', [640, 1080], 1080, 920, 'Artist’s impression of a living room with a sea view at Family Residential Resort — developer’s render'),
        img('kizingo-dining', [640, 1080], 1080, 920, 'Artist’s impression of a dining room at Family Residential Resort — developer’s render'),
        img('kizingo-bedroom', [640, 1080], 1080, 920, 'Artist’s impression of a bedroom at Family Residential Resort — developer’s render'),
        img('kizingo-aerial', [640, 1080], 1080, 500, 'Artist’s impression of Family Residential Resort among Kizingo’s rooftops — developer’s render'),
      ],
    },
  },
  {
    slug: 'emaar-apartments-stadium',
    name: 'Emaar Apartments',
    area: 'stadium',
    location: 'Stadium, Mombasa',
    status: 'For sale',
    intro: 'Forty-five two- and three-bedroom apartments in Stadium, a short drive from both Nyali and the city centre. Blu’s flyer gives offers from KES 5M.',
    headline: ['Forty-five apartments,', 'offers from KES 5M.'],
    about: [
      'The two-bedroom plan is 1,200 sq ft. The three-bedroom is 1,800 sq ft and has its own kitchen and laundry area. A penthouse looks out over the Stadium area.',
      'The building has two high-speed lifts, a backup generator, a borehole, CCTV and parking. Schools, supermarkets and medical care are all close by.',
    ],
    spec: { beds: '2 & 3', dsq: false, size: '1,200', sizeNote: 'to 1,800 sq ft', price: '5', priceNote: 'offers from' },
    fromPrice: 'KES 5M',
    units: [
      { name: '2 bedrooms', detail: 'Apartment', size: '1,200 sq ft', sizeAlt: '111 m²', price: 'Offers from KES 5M' },
      { name: '3 bedrooms', detail: 'With kitchen and laundry area', size: '1,800 sq ft', sizeAlt: '167 m²', price: 'Ask Blu' },
    ],
    highlights: ['45 apartments', 'Two high-speed lifts', 'Penthouse over the Stadium area'],
    amenities: ['Two high-speed lifts', 'Backup generator', 'Borehole', 'CCTV surveillance', 'Parking'],
    payment: null,
    paymentNote: null,
    nearby: ['Quick access to Nyali and the city centre', 'Close to schools and supermarkets', 'Medical facilities nearby'],
    source: { date: '2 May 2026', url: ig('DX1U542CFwU') },
    images: {
      cover: img('emaar-tower', [455], 455, 1050, 'Artist’s impression of the Emaar Apartments tower in Stadium, Mombasa — the developer’s render, posted by Blu Real Estate'),
      portrait: img('emaar-tower', [455], 455, 1050, 'Artist’s impression of the Emaar Apartments tower in Stadium, Mombasa — the developer’s render, posted by Blu Real Estate'),
      gallery: [
        img('emaar-tower', [455], 455, 1050, 'Artist’s impression of the Emaar Apartments tower — developer’s render'),
      ],
    },
  },
];

export const count = (area) => LISTINGS.filter((l) => l.area === area).length;
