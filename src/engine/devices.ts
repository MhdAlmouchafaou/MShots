import type { Color } from './types';

export type DeviceCategory = 'phone' | 'foldable' | 'tablet' | 'laptop' | 'desktop' | 'tv' | 'watch' | 'browser';

export type Cutout =
  | { type: 'none' }
  /** Pill under the top edge (Dynamic Island style). Sizes in body units (mm). */
  | { type: 'island'; w: number; h: number; y: number }
  /** Classic notch attached to the top edge. */
  | { type: 'notch'; w: number; h: number }
  /** Punch-hole camera; x is 0..1 across the screen. */
  | { type: 'punch'; r: number; x: number; y: number }
  /** Small camera dot in the bezel (tablets, laptops, TVs). */
  | { type: 'dot'; r: number };

export type Finish = {
  id: string;
  name: string;
  /** Metal band / frame colour. */
  frame: Color;
  /** Back / body colour (back view, laptop deck, watch case). */
  body: Color;
  /** Highlight on the edge of the frame. */
  edge: Color;
};

export type Button = { side: 'left' | 'right' | 'top'; at: number; len: number };

export type DeviceSpec = {
  id: string;
  name: string;
  category: DeviceCategory;
  /** Visual family: drives status bar style and small details. */
  family: 'ios' | 'android' | 'mac' | 'windows' | 'generic';
  year?: number;
  /** Outer body size (portrait for handhelds) in millimetres, and corner radius. */
  body: { w: number; h: number; r: number };
  /** Width of the visible metal band around the front glass. */
  frame: number;
  /** Black border between the band and the active screen (per side, top/bottom may differ). */
  bezel: { side: number; top: number; bottom: number };
  /** Corner radius of the active screen. */
  screenR: number;
  cutout: Cutout;
  buttons: Button[];
  /** Thickness in millimetres (3D extrusion). */
  depth: number;
  /** Native screen resolution (portrait for handhelds), for the screenshot ratio. */
  px: { w: number; h: number };
  finishes: Finish[];
  /** Back camera module (back view): position/size in body units, number of lenses. */
  camera?: { x: number; y: number; w: number; h: number; r: number; lenses: 1 | 2 | 3 | 4; layout: 'triangle' | 'column' | 'row' | 'bar' | 'diagonal' };
  /** Laptops: lower deck. Desktops: stand. TVs: feet. Watches: strap. */
  base?: {
    style: 'deck' | 'stand' | 'chin-stand' | 'feet' | 'pedestal' | 'strap' | 'crown-strap' | 'none';
    /** Height of the deck/stand in body units. */
    h: number;
    /** Width of the deck (laptops) / foot (desktops) relative to the body width. */
    w: number;
    color?: Color;
  };
  /** Chin under the screen (iMac style) in body units and its colour from the finish body. */
  chin?: number;
  /** Laptop / browser: aspect of the deck notch or the browser chrome. */
  browser?: { theme: 'light' | 'dark'; style: 'safari' | 'chrome' | 'minimal' };
  /** Crease of foldables (vertical line in the middle). */
  crease?: boolean;
  /** Round watch faces. */
  round?: boolean;
  tags?: string[];
};

// ------------------------------------------------------------------ finishes

const F = (id: string, name: string, frame: Color, body: Color, edge: Color): Finish => ({ id, name, frame, body, edge });

export const TITANIUM = [
  F('natural', 'Titane naturel', '#B9B4AA', '#C9C4BA', '#E9E5DD'),
  F('black', 'Titane noir', '#3A3A3C', '#2B2B2D', '#6B6B70'),
  F('white', 'Titane blanc', '#DCDAD6', '#ECEBE8', '#FFFFFF'),
  F('desert', 'Titane désert', '#C4AA8E', '#D7C1A8', '#EBDAC6'),
  F('orange', 'Orange cosmique', '#E2793B', '#EE8A4A', '#FFB27E'),
  F('blue', 'Bleu intense', '#2F4058', '#34465F', '#5C7290'),
  F('silver', 'Argent', '#D5D7DA', '#E4E6E8', '#FFFFFF'),
];

export const ALUMINIUM = [
  F('black', 'Noir', '#2E2F33', '#3A3B40', '#5E6066'),
  F('white', 'Blanc', '#E7E7E4', '#F2F2EF', '#FFFFFF'),
  F('pink', 'Rose', '#F1C9CF', '#F6D6DB', '#FFEFF1'),
  F('teal', 'Sarcelle', '#9CC7C4', '#B1D6D3', '#DFF2F0'),
  F('ultramarine', 'Outremer', '#6E7FD8', '#8191E3', '#B7C2F7'),
  F('lavender', 'Lavande', '#C9C1E6', '#D8D1F0', '#F1EDFF'),
  F('sage', 'Sauge', '#B9C3A7', '#C8D1B7', '#E6EDD9'),
  F('mist', 'Bleu brume', '#B9CBDC', '#C9D8E6', '#EAF2F9'),
];

export const ANDROID = [
  F('obsidian', 'Obsidienne', '#25262A', '#2E2F34', '#55575E'),
  F('porcelain', 'Porcelaine', '#E9E6DF', '#F2EFE9', '#FFFFFF'),
  F('moonstone', 'Pierre de lune', '#8E9AA8', '#A1ADBA', '#CFD8E2'),
  F('jade', 'Jade', '#A9C9B8', '#BAD7C7', '#E2F1E8'),
  F('rose', 'Quartz rose', '#E9C3C0', '#F1D1CE', '#FFF0EE'),
  F('titanium-gray', 'Titane gris', '#8B8C8E', '#9D9EA0', '#C9CACC'),
  F('titanium-blue', 'Titane bleu', '#4B5D76', '#5A6D86', '#8C9DB4'),
  F('red', 'Rouge', '#C9433D', '#D7514A', '#F08D86'),
];

export const MAC = [
  F('space-black', 'Noir sidéral', '#2B2C2F', '#323337', '#58595E'),
  F('silver', 'Argent', '#D9DADC', '#E3E4E6', '#F7F8F9'),
  F('midnight', 'Minuit', '#2E3642', '#36404D', '#5A6676'),
  F('starlight', 'Lumière stellaire', '#E3DCCF', '#ECE6DA', '#FBF7EF'),
  F('sky', 'Bleu ciel', '#C8D6E2', '#D4E0EA', '#F0F6FA'),
];

export const IMAC = [
  F('blue', 'Bleu', '#2F5C8E', '#7FA6D0', '#A9C5E4'),
  F('green', 'Vert', '#3E7A5A', '#8CC3A2', '#B7DCC5'),
  F('pink', 'Rose', '#B65568', '#EBA7B3', '#F6CDD5'),
  F('silver', 'Argent', '#B9BCC0', '#DCDEE1', '#F3F4F5'),
  F('yellow', 'Jaune', '#C9A13A', '#F2D27A', '#FBE8B5'),
  F('orange', 'Orange', '#C4613A', '#F0A07E', '#F9C9B3'),
  F('purple', 'Violet', '#5E4C8E', '#B6A6DC', '#D6CCF0'),
];

export const NEUTRAL = [
  F('black', 'Noir', '#1C1C1E', '#232325', '#4A4A4E'),
  F('graphite', 'Graphite', '#45464A', '#505156', '#7B7C82'),
  F('silver', 'Argent', '#CFD1D4', '#DDDFE1', '#F5F6F7'),
  F('white', 'Blanc', '#ECECEA', '#F5F5F3', '#FFFFFF'),
];

// ------------------------------------------------------------------ catalog

const islandPhone = (id: string, name: string, w: number, h: number, extra: Partial<DeviceSpec> = {}): DeviceSpec => ({
  id,
  name,
  category: 'phone',
  family: 'ios',
  body: { w, h, r: w * 0.165 },
  frame: 1.05,
  bezel: { side: 1.25, top: 1.25, bottom: 1.25 },
  screenR: w * 0.145,
  cutout: { type: 'island', w: 18.8, h: 5.6, y: 1.9 },
  buttons: [
    { side: 'left', at: 0.17, len: 0.035 },
    { side: 'left', at: 0.25, len: 0.07 },
    { side: 'left', at: 0.34, len: 0.07 },
    { side: 'right', at: 0.27, len: 0.11 },
    { side: 'right', at: 0.62, len: 0.06 },
  ],
  depth: 8.25,
  px: { w: 1206, h: 2622 },
  finishes: TITANIUM,
  camera: { x: 0.08, y: 0.035, w: 0.5, h: 0.24, r: 0.16, lenses: 3, layout: 'triangle' },
  tags: ['apple', 'iphone'],
  ...extra,
});

const punchPhone = (id: string, name: string, w: number, h: number, extra: Partial<DeviceSpec> = {}): DeviceSpec => ({
  id,
  name,
  category: 'phone',
  family: 'android',
  body: { w, h, r: w * 0.12 },
  frame: 0.9,
  bezel: { side: 1.35, top: 1.45, bottom: 1.6 },
  screenR: w * 0.1,
  cutout: { type: 'punch', r: 1.65, x: 0.5, y: 3.4 },
  buttons: [
    { side: 'right', at: 0.2, len: 0.07 },
    { side: 'right', at: 0.32, len: 0.13 },
  ],
  depth: 8.5,
  px: { w: 1080, h: 2400 },
  finishes: ANDROID,
  camera: { x: 0.08, y: 0.04, w: 0.84, h: 0.12, r: 0.5, lenses: 3, layout: 'bar' },
  tags: ['android'],
  ...extra,
});

export const DEVICES: DeviceSpec[] = [
  // --- phones
  islandPhone('iphone-17-pro', 'iPhone 17 Pro', 71.9, 150.0, { year: 2025 }),
  islandPhone('iphone-17-pro-max', 'iPhone 17 Pro Max', 78.0, 163.4, { year: 2025, px: { w: 1320, h: 2868 } }),
  islandPhone('iphone-air', 'iPhone Air', 74.7, 156.2, { year: 2025, depth: 5.6, finishes: ALUMINIUM, camera: { x: 0.06, y: 0.03, w: 0.88, h: 0.11, r: 0.5, lenses: 1, layout: 'bar' } }),
  islandPhone('iphone-17', 'iPhone 17', 71.5, 149.6, { year: 2025, finishes: ALUMINIUM, frame: 1.15, camera: { x: 0.08, y: 0.035, w: 0.4, h: 0.2, r: 0.2, lenses: 2, layout: 'column' } }),
  islandPhone('iphone-16-pro', 'iPhone 16 Pro', 71.5, 149.6, { year: 2024 }),
  islandPhone('iphone-15', 'iPhone 15', 71.6, 147.6, { year: 2023, finishes: ALUMINIUM, frame: 1.2, camera: { x: 0.08, y: 0.035, w: 0.42, h: 0.2, r: 0.22, lenses: 2, layout: 'diagonal' } }),
  {
    ...islandPhone('iphone-14', 'iPhone 14', 71.5, 146.7, { year: 2022, finishes: ALUMINIUM, frame: 1.3 }),
    cutout: { type: 'notch', w: 34, h: 5.2 },
    bezel: { side: 1.9, top: 1.9, bottom: 1.9 },
    camera: { x: 0.08, y: 0.035, w: 0.42, h: 0.2, r: 0.22, lenses: 2, layout: 'diagonal' },
  },
  punchPhone('pixel-10-pro', 'Pixel 10 Pro', 72.0, 152.8, { year: 2025, body: { w: 72, h: 152.8, r: 10.5 }, screenR: 8.5, camera: { x: 0.0, y: 0.075, w: 1.0, h: 0.1, r: 0.5, lenses: 3, layout: 'bar' } }),
  punchPhone('pixel-10', 'Pixel 10', 72.0, 152.8, { year: 2025, body: { w: 72, h: 152.8, r: 10.5 }, screenR: 8.5, bezel: { side: 1.6, top: 1.7, bottom: 1.9 }, camera: { x: 0.0, y: 0.075, w: 1.0, h: 0.1, r: 0.5, lenses: 2, layout: 'bar' } }),
  punchPhone('galaxy-s25-ultra', 'Galaxy S25 Ultra', 77.6, 162.8, { year: 2025, body: { w: 77.6, h: 162.8, r: 5.2 }, screenR: 3.6, bezel: { side: 1.2, top: 1.3, bottom: 1.3 }, finishes: ANDROID.slice(5).concat(ANDROID.slice(0, 2)), camera: { x: 0.07, y: 0.04, w: 0.2, h: 0.3, r: 0.5, lenses: 4, layout: 'column' } }),
  punchPhone('galaxy-s25', 'Galaxy S25', 70.5, 146.9, { year: 2025, body: { w: 70.5, h: 146.9, r: 9 }, screenR: 7.5, camera: { x: 0.08, y: 0.04, w: 0.18, h: 0.33, r: 0.5, lenses: 3, layout: 'column' } }),
  punchPhone('galaxy-a56', 'Galaxy A56', 77.5, 162.2, { year: 2025, body: { w: 77.5, h: 162.2, r: 10 }, bezel: { side: 2.1, top: 2.2, bottom: 3.0 }, camera: { x: 0.07, y: 0.04, w: 0.22, h: 0.3, r: 0.3, lenses: 3, layout: 'column' } }),
  punchPhone('nothing-phone-3', 'Nothing Phone (3)', 75.6, 160.6, { year: 2025, body: { w: 75.6, h: 160.6, r: 9.5 }, bezel: { side: 1.5, top: 1.5, bottom: 1.5 }, finishes: [NEUTRAL[3], NEUTRAL[0]], camera: { x: 0.52, y: 0.04, w: 0.4, h: 0.26, r: 0.2, lenses: 3, layout: 'diagonal' } }),
  punchPhone('oneplus-13', 'OnePlus 13', 76.5, 162.9, { year: 2025, body: { w: 76.5, h: 162.9, r: 11 }, camera: { x: 0.1, y: 0.04, w: 0.42, h: 0.2, r: 0.5, lenses: 3, layout: 'triangle' } }),
  punchPhone('xiaomi-15', 'Xiaomi 15', 71.2, 152.3, { year: 2025, body: { w: 71.2, h: 152.3, r: 9.5 }, camera: { x: 0.08, y: 0.04, w: 0.42, h: 0.2, r: 0.18, lenses: 3, layout: 'triangle' } }),
  punchPhone('tecno-camon', 'Tecno Camon 40', 75.0, 165.6, { year: 2025, body: { w: 75, h: 165.6, r: 10 }, bezel: { side: 1.9, top: 2.0, bottom: 2.6 }, camera: { x: 0.08, y: 0.04, w: 0.45, h: 0.22, r: 0.5, lenses: 3, layout: 'triangle' } }),
  punchPhone('android-generic', 'Android (générique)', 74.0, 160.0, { body: { w: 74, h: 160, r: 9 } }),
  // --- foldables
  {
    ...punchPhone('galaxy-z-fold7', 'Galaxy Z Fold7 (ouvert)', 143.2, 158.4, { year: 2025, body: { w: 143.2, h: 158.4, r: 6 }, screenR: 4, bezel: { side: 2.0, top: 2.2, bottom: 2.2 }, depth: 4.2, px: { w: 1968, h: 2184 } }),
    category: 'foldable',
    crease: true,
    cutout: { type: 'punch', r: 1.5, x: 0.78, y: 3.5 },
  },
  {
    ...punchPhone('galaxy-z-flip7', 'Galaxy Z Flip7', 75.2, 166.7, { year: 2025, body: { w: 75.2, h: 166.7, r: 9 }, depth: 6.5, px: { w: 1080, h: 2520 } }),
    category: 'foldable',
    crease: true,
  },
  // --- tablets
  {
    id: 'ipad-pro-13',
    name: 'iPad Pro 13″',
    category: 'tablet',
    family: 'ios',
    year: 2024,
    body: { w: 215.5, h: 281.6, r: 15 },
    frame: 1.3,
    bezel: { side: 7.2, top: 7.2, bottom: 7.2 },
    screenR: 9,
    cutout: { type: 'dot', r: 1.1 },
    buttons: [{ side: 'top', at: 0.86, len: 0.08 }, { side: 'right', at: 0.08, len: 0.06 }, { side: 'right', at: 0.15, len: 0.06 }],
    depth: 5.1,
    px: { w: 2064, h: 2752 },
    finishes: [MAC[0], MAC[1]],
    camera: { x: 0.06, y: 0.025, w: 0.2, h: 0.15, r: 0.3, lenses: 2, layout: 'column' },
    tags: ['apple', 'ipad'],
  },
  {
    id: 'ipad-pro-11',
    name: 'iPad Pro 11″',
    category: 'tablet',
    family: 'ios',
    year: 2024,
    body: { w: 177.5, h: 249.7, r: 14 },
    frame: 1.3,
    bezel: { side: 7.0, top: 7.0, bottom: 7.0 },
    screenR: 9,
    cutout: { type: 'dot', r: 1.1 },
    buttons: [{ side: 'top', at: 0.86, len: 0.09 }, { side: 'right', at: 0.08, len: 0.07 }],
    depth: 5.3,
    px: { w: 1668, h: 2420 },
    finishes: [MAC[0], MAC[1]],
    camera: { x: 0.06, y: 0.025, w: 0.22, h: 0.16, r: 0.3, lenses: 2, layout: 'column' },
    tags: ['apple', 'ipad'],
  },
  {
    id: 'ipad-air-11',
    name: 'iPad Air 11″',
    category: 'tablet',
    family: 'ios',
    year: 2025,
    body: { w: 178.5, h: 247.6, r: 14 },
    frame: 1.5,
    bezel: { side: 9.0, top: 9.0, bottom: 9.0 },
    screenR: 9,
    cutout: { type: 'dot', r: 1.1 },
    buttons: [{ side: 'top', at: 0.86, len: 0.09 }, { side: 'right', at: 0.08, len: 0.07 }],
    depth: 6.1,
    px: { w: 1640, h: 2360 },
    finishes: [MAC[4], MAC[3], ALUMINIUM[5], MAC[0]],
    camera: { x: 0.06, y: 0.025, w: 0.12, h: 0.09, r: 0.5, lenses: 1, layout: 'column' },
    tags: ['apple', 'ipad'],
  },
  {
    id: 'ipad-mini',
    name: 'iPad mini',
    category: 'tablet',
    family: 'ios',
    year: 2024,
    body: { w: 134.8, h: 195.4, r: 12 },
    frame: 1.4,
    bezel: { side: 7.5, top: 7.5, bottom: 7.5 },
    screenR: 8,
    cutout: { type: 'dot', r: 1 },
    buttons: [{ side: 'top', at: 0.84, len: 0.12 }],
    depth: 6.3,
    px: { w: 1488, h: 2266 },
    finishes: [MAC[0], MAC[3], ALUMINIUM[5], MAC[4]],
    tags: ['apple', 'ipad'],
  },
  {
    id: 'galaxy-tab-s10',
    name: 'Galaxy Tab S10 Ultra',
    category: 'tablet',
    family: 'android',
    year: 2024,
    body: { w: 208.6, h: 326.4, r: 12 },
    frame: 1.0,
    bezel: { side: 6.5, top: 6.5, bottom: 6.5 },
    screenR: 6,
    cutout: { type: 'notch', w: 20, h: 3.2 },
    buttons: [{ side: 'right', at: 0.12, len: 0.06 }, { side: 'right', at: 0.2, len: 0.1 }],
    depth: 5.4,
    px: { w: 1848, h: 2960 },
    finishes: [ANDROID[5], ANDROID[1]],
    tags: ['android'],
  },
  {
    id: 'tablet-generic',
    name: 'Tablette Android',
    category: 'tablet',
    family: 'android',
    body: { w: 165, h: 254, r: 12 },
    frame: 1.0,
    bezel: { side: 9, top: 10, bottom: 10 },
    screenR: 5,
    cutout: { type: 'dot', r: 1.1 },
    buttons: [{ side: 'right', at: 0.15, len: 0.1 }],
    depth: 7,
    px: { w: 1200, h: 1920 },
    finishes: NEUTRAL,
    tags: ['android'],
  },
  // --- laptops (body = lid, screen in landscape; base = deck)
  {
    id: 'macbook-pro-14',
    name: 'MacBook Pro 14″',
    category: 'laptop',
    family: 'mac',
    year: 2024,
    body: { w: 312.6, h: 204, r: 9 },
    frame: 0.8,
    bezel: { side: 5.2, top: 6.5, bottom: 6.5 },
    screenR: 5,
    cutout: { type: 'notch', w: 30, h: 5.6 },
    buttons: [],
    depth: 15.5,
    px: { w: 3024, h: 1964 },
    finishes: [MAC[0], MAC[1]],
    base: { style: 'deck', h: 9, w: 1.13 },
    tags: ['apple', 'mac', 'web'],
  },
  {
    id: 'macbook-pro-16',
    name: 'MacBook Pro 16″',
    category: 'laptop',
    family: 'mac',
    year: 2024,
    body: { w: 355.7, h: 232, r: 10 },
    frame: 0.8,
    bezel: { side: 5.5, top: 7, bottom: 7 },
    screenR: 5,
    cutout: { type: 'notch', w: 32, h: 6 },
    buttons: [],
    depth: 16.8,
    px: { w: 3456, h: 2234 },
    finishes: [MAC[0], MAC[1]],
    base: { style: 'deck', h: 10, w: 1.12 },
    tags: ['apple', 'mac', 'web'],
  },
  {
    id: 'macbook-air-13',
    name: 'MacBook Air 13″',
    category: 'laptop',
    family: 'mac',
    year: 2025,
    body: { w: 304.1, h: 197, r: 9 },
    frame: 0.8,
    bezel: { side: 6, top: 7.4, bottom: 7.4 },
    screenR: 5,
    cutout: { type: 'notch', w: 30, h: 5.6 },
    buttons: [],
    depth: 11.3,
    px: { w: 2560, h: 1664 },
    finishes: [MAC[2], MAC[3], MAC[1], MAC[4]],
    base: { style: 'deck', h: 6.5, w: 1.12 },
    tags: ['apple', 'mac', 'web'],
  },
  {
    id: 'laptop-windows',
    name: 'Ordinateur portable',
    category: 'laptop',
    family: 'windows',
    body: { w: 320, h: 212, r: 6 },
    frame: 0.6,
    bezel: { side: 6, top: 9, bottom: 14 },
    screenR: 1.5,
    cutout: { type: 'dot', r: 1.2 },
    buttons: [],
    depth: 16,
    px: { w: 1920, h: 1200 },
    finishes: NEUTRAL,
    base: { style: 'deck', h: 9, w: 1.1 },
    tags: ['windows', 'web'],
  },
  {
    id: 'surface-laptop',
    name: 'Surface Laptop',
    category: 'laptop',
    family: 'windows',
    year: 2024,
    body: { w: 300, h: 214, r: 8 },
    frame: 0.6,
    bezel: { side: 7, top: 8, bottom: 8 },
    screenR: 3,
    cutout: { type: 'dot', r: 1.2 },
    buttons: [],
    depth: 15,
    px: { w: 2304, h: 1536 },
    finishes: [NEUTRAL[0], MAC[1], ALUMINIUM[7], ALUMINIUM[6]],
    base: { style: 'deck', h: 8, w: 1.08 },
    tags: ['windows', 'web'],
  },
  // --- desktops
  {
    id: 'imac-24',
    name: 'iMac 24″',
    category: 'desktop',
    family: 'mac',
    year: 2024,
    body: { w: 547, h: 405, r: 8 },
    frame: 0,
    bezel: { side: 12, top: 12, bottom: 12 },
    screenR: 0,
    cutout: { type: 'none' },
    buttons: [],
    depth: 11.5,
    px: { w: 4480, h: 2520 },
    finishes: IMAC,
    chin: 74,
    base: { style: 'chin-stand', h: 140, w: 0.27 },
    tags: ['apple', 'mac', 'web'],
  },
  {
    id: 'studio-display',
    name: 'Studio Display',
    category: 'desktop',
    family: 'mac',
    year: 2022,
    body: { w: 623, h: 362, r: 8 },
    frame: 0,
    bezel: { side: 15, top: 15, bottom: 15 },
    screenR: 0,
    cutout: { type: 'none' },
    buttons: [],
    depth: 20,
    px: { w: 5120, h: 2880 },
    finishes: [MAC[1], MAC[0]],
    base: { style: 'stand', h: 150, w: 0.3 },
    tags: ['apple', 'web'],
  },
  {
    id: 'monitor-27',
    name: 'Écran 27″',
    category: 'desktop',
    family: 'windows',
    body: { w: 614, h: 362, r: 4 },
    frame: 0,
    bezel: { side: 7, top: 7, bottom: 18 },
    screenR: 0,
    cutout: { type: 'none' },
    buttons: [],
    depth: 40,
    px: { w: 2560, h: 1440 },
    finishes: NEUTRAL,
    base: { style: 'pedestal', h: 160, w: 0.36 },
    tags: ['windows', 'web'],
  },
  {
    id: 'monitor-ultrawide',
    name: 'Écran ultra-large 34″',
    category: 'desktop',
    family: 'windows',
    body: { w: 810, h: 360, r: 4 },
    frame: 0,
    bezel: { side: 7, top: 7, bottom: 16 },
    screenR: 0,
    cutout: { type: 'none' },
    buttons: [],
    depth: 50,
    px: { w: 3440, h: 1440 },
    finishes: NEUTRAL,
    base: { style: 'pedestal', h: 170, w: 0.3 },
    tags: ['web'],
  },
  // --- TVs
  {
    id: 'tv-65',
    name: 'TV 65″',
    category: 'tv',
    family: 'generic',
    body: { w: 1449, h: 832, r: 4 },
    frame: 0,
    bezel: { side: 9, top: 9, bottom: 12 },
    screenR: 0,
    cutout: { type: 'none' },
    buttons: [],
    depth: 25,
    px: { w: 3840, h: 2160 },
    finishes: NEUTRAL,
    base: { style: 'feet', h: 60, w: 0.8 },
    tags: ['tv'],
  },
  {
    id: 'tv-frame',
    name: 'TV cadre',
    category: 'tv',
    family: 'generic',
    body: { w: 1449, h: 832, r: 2 },
    frame: 0,
    bezel: { side: 42, top: 42, bottom: 42 },
    screenR: 0,
    cutout: { type: 'none' },
    buttons: [],
    depth: 25,
    px: { w: 3840, h: 2160 },
    finishes: [F('wood', 'Bois', '#8A5B3A', '#A06C47', '#C79068'), F('white', 'Blanc', '#EFEFEC', '#F7F7F5', '#FFFFFF'), F('black', 'Noir', '#1D1D1F', '#262628', '#4A4A4E')],
    base: { style: 'none', h: 0, w: 0 },
    tags: ['tv'],
  },
  // --- watches
  {
    id: 'watch-ultra',
    name: 'Watch Ultra',
    category: 'watch',
    family: 'ios',
    year: 2025,
    body: { w: 44, h: 49, r: 10 },
    frame: 2.4,
    bezel: { side: 2.0, top: 2.0, bottom: 2.0 },
    screenR: 7,
    cutout: { type: 'none' },
    buttons: [{ side: 'right', at: 0.38, len: 0.24 }, { side: 'right', at: 0.7, len: 0.2 }, { side: 'left', at: 0.42, len: 0.22 }],
    depth: 12,
    px: { w: 422, h: 514 },
    finishes: [F('natural', 'Titane naturel', '#BEB9AF', '#D6D2C8', '#F1EDE5'), F('black', 'Titane noir', '#2C2C2E', '#38383B', '#6A6A6E')],
    base: { style: 'crown-strap', h: 46, w: 0.92, color: '#E46B2E' },
    tags: ['apple', 'watch'],
  },
  {
    id: 'watch-series',
    name: 'Watch Series',
    category: 'watch',
    family: 'ios',
    year: 2025,
    body: { w: 39, h: 46, r: 11 },
    frame: 1.2,
    bezel: { side: 2.4, top: 2.4, bottom: 2.4 },
    screenR: 8,
    cutout: { type: 'none' },
    buttons: [{ side: 'right', at: 0.32, len: 0.2 }, { side: 'right', at: 0.62, len: 0.18 }],
    depth: 9.7,
    px: { w: 416, h: 496 },
    finishes: [F('jet', 'Noir de jais', '#1E1E20', '#28282A', '#5A5A5E'), F('silver', 'Argent', '#D7D9DC', '#E5E7E9', '#FFFFFF'), F('rose', 'Or rose', '#E2BFB2', '#ECCFC4', '#FAEAE4')],
    base: { style: 'strap', h: 46, w: 0.82, color: '#2B2B2E' },
    tags: ['apple', 'watch'],
  },
  {
    id: 'watch-round',
    name: 'Montre ronde',
    category: 'watch',
    family: 'android',
    year: 2025,
    body: { w: 46, h: 46, r: 23 },
    frame: 2.6,
    bezel: { side: 2.4, top: 2.4, bottom: 2.4 },
    screenR: 20,
    cutout: { type: 'none' },
    buttons: [{ side: 'right', at: 0.3, len: 0.12 }, { side: 'right', at: 0.62, len: 0.12 }],
    depth: 11,
    px: { w: 480, h: 480 },
    finishes: [ANDROID[0], ANDROID[1], ANDROID[5]],
    round: true,
    base: { style: 'strap', h: 44, w: 0.5, color: '#202022' },
    tags: ['android', 'watch'],
  },
  // --- browser windows (no hardware: perfect for websites)
  {
    id: 'browser-light',
    name: 'Navigateur clair',
    category: 'browser',
    family: 'generic',
    body: { w: 1440, h: 960, r: 14 },
    frame: 0,
    bezel: { side: 0, top: 52, bottom: 0 },
    screenR: 0,
    cutout: { type: 'none' },
    buttons: [],
    depth: 0,
    px: { w: 1440, h: 908 },
    finishes: [F('light', 'Clair', '#F4F4F5', '#FFFFFF', '#E4E4E7')],
    browser: { theme: 'light', style: 'safari' },
    tags: ['web'],
  },
  {
    id: 'browser-dark',
    name: 'Navigateur sombre',
    category: 'browser',
    family: 'generic',
    body: { w: 1440, h: 960, r: 14 },
    frame: 0,
    bezel: { side: 0, top: 52, bottom: 0 },
    screenR: 0,
    cutout: { type: 'none' },
    buttons: [],
    depth: 0,
    px: { w: 1440, h: 908 },
    finishes: [F('dark', 'Sombre', '#232326', '#1A1A1D', '#38383C')],
    browser: { theme: 'dark', style: 'chrome' },
    tags: ['web'],
  },
  {
    id: 'browser-minimal',
    name: 'Fenêtre minimale',
    category: 'browser',
    family: 'generic',
    body: { w: 1440, h: 940, r: 16 },
    frame: 0,
    bezel: { side: 0, top: 32, bottom: 0 },
    screenR: 0,
    cutout: { type: 'none' },
    buttons: [],
    depth: 0,
    px: { w: 1440, h: 908 },
    finishes: [F('light', 'Clair', '#EDEDEF', '#FFFFFF', '#DCDCE0'), F('dark', 'Sombre', '#1E1E21', '#141416', '#333337')],
    browser: { theme: 'light', style: 'minimal' },
    tags: ['web'],
  },
];

const BY_ID = new Map(DEVICES.map((d) => [d.id, d]));

export function deviceById(id: string): DeviceSpec {
  return BY_ID.get(id) ?? DEVICES[0];
}

export function finishOf(spec: DeviceSpec, id: string): Finish {
  return spec.finishes.find((f) => f.id === id) ?? spec.finishes[0];
}

/** Devices registered later (catalog extensions) are added here. */
export function registerDevices(list: DeviceSpec[]) {
  for (const d of list) {
    if (BY_ID.has(d.id)) continue;
    DEVICES.push(d);
    BY_ID.set(d.id, d);
  }
}

export const CATEGORY_LABEL: Record<DeviceCategory, string> = {
  phone: 'Téléphones',
  foldable: 'Pliables',
  tablet: 'Tablettes',
  laptop: 'Portables',
  desktop: 'Écrans',
  tv: 'TV',
  watch: 'Montres',
  browser: 'Navigateur',
};

/**
 * Overall drawn size of a device (body + base/stand/strap) in body units, landscape aware.
 * The renderer scales body units so that the larger side equals layer.size.
 */
export function drawnSize(spec: DeviceSpec, landscape: boolean) {
  const rotate = landscape && (spec.category === 'phone' || spec.category === 'tablet' || spec.category === 'foldable');
  const bw = rotate ? spec.body.h : spec.body.w;
  const bh = rotate ? spec.body.w : spec.body.h;
  let w = bw;
  let h = bh;
  if (spec.base) {
    if (spec.base.style === 'deck') {
      w = Math.max(w, bw * spec.base.w);
      h += spec.base.h;
    } else if (spec.base.style === 'stand' || spec.base.style === 'chin-stand' || spec.base.style === 'pedestal' || spec.base.style === 'feet') {
      h += spec.base.h;
    } else if (spec.base.style === 'strap' || spec.base.style === 'crown-strap') {
      h += spec.base.h * 2;
    }
  }
  return { w, h, bw, bh, rotate };
}

/** Screen rect inside the body (body units, relative to body top-left), landscape aware. */
export function screenRect(spec: DeviceSpec, landscape: boolean) {
  const { bw, bh, rotate } = drawnSize(spec, landscape);
  const f = spec.frame;
  const b = spec.bezel;
  if (rotate) {
    // Rotated 90° clockwise: the top bezel becomes the right one.
    return { x: f + b.bottom, y: f + b.side, w: bw - 2 * f - b.top - b.bottom, h: bh - 2 * f - 2 * b.side, r: spec.screenR };
  }
  return { x: f + b.side, y: f + b.top, w: bw - 2 * f - 2 * b.side, h: bh - 2 * f - b.top - b.bottom - (spec.chin ?? 0), r: spec.screenR };
}

/** Screen aspect (w/h) of the active area. */
export function screenAspect(spec: DeviceSpec, landscape: boolean) {
  const r = screenRect(spec, landscape);
  return r.w / r.h;
}
