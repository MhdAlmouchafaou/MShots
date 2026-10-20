/** Small colour helpers (hex strings) used by the renderer. */

export function parseHex(c: string): [number, number, number, number] {
  let s = c.trim();
  if (s.startsWith('rgba') || s.startsWith('rgb')) {
    const m = s.match(/[\d.]+/g) ?? [];
    return [Number(m[0] ?? 0), Number(m[1] ?? 0), Number(m[2] ?? 0), m[3] !== undefined ? Number(m[3]) : 1];
  }
  if (s.startsWith('#')) s = s.slice(1);
  if (s.length === 3 || s.length === 4) s = s.split('').map((x) => x + x).join('');
  const n = parseInt(s.slice(0, 6), 16);
  const a = s.length >= 8 ? parseInt(s.slice(6, 8), 16) / 255 : 1;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
}

const h2 = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');

export function toHex(r: number, g: number, b: number, a = 1) {
  return `#${h2(r)}${h2(g)}${h2(b)}${a < 1 ? h2(a * 255) : ''}`;
}

/** Mix a towards b (t = 0 → a, 1 → b). */
export function mix(a: string, b: string, t: number) {
  const [r1, g1, b1, a1] = parseHex(a);
  const [r2, g2, b2, a2] = parseHex(b);
  return toHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t, a1 + (a2 - a1) * t);
}

export const shade = (c: string, t: number) => (t >= 0 ? mix(c, '#ffffff', t) : mix(c, '#000000', -t));

export function alpha(c: string, a: number) {
  const [r, g, b, a0] = parseHex(c);
  return toHex(r, g, b, a0 * a);
}

export function luminance(c: string) {
  const [r, g, b] = parseHex(c).map((v, i) => (i < 3 ? v / 255 : v));
  const f = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export const isDark = (c: string) => luminance(c) < 0.35;

export function hsl(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return toHex(f(0) * 255, f(8) * 255, f(4) * 255);
}
