import { Skia, type SkRuntimeEffect } from '@shopify/react-native-skia';
import type { LightPattern, TextureId } from '../types';

/** Shared noise helpers (value noise, fbm, cellular, rotation). */
const NOISE = `
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  float a = hash(i); float b = hash(i + vec2(1.0, 0.0)); float c = hash(i + vec2(0.0, 1.0)); float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
float fbm(vec2 p) {
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * vnoise(p); p = p * 2.03 + vec2(17.1, 9.7); a *= 0.5; }
  return v;
}
float fbm3(vec2 p) {
  float v = 0.0; float a = 0.5;
  for (int i = 0; i < 3; i++) { v += a * vnoise(p); p = p * 2.07 + vec2(11.3, 5.1); a *= 0.5; }
  return v;
}
float cell(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p); float m = 8.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y));
      vec2 o = vec2(hash(i + g), hash(i + g + 19.19));
      m = min(m, length(g + o - f));
    }
  }
  return m;
}
vec2 rot(vec2 p, float a) { float c = cos(a); float s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }
`;

const TEXTURE_IDS: TextureId[] = ['fabric', 'velvet', 'linen', 'concrete', 'stone', 'marble', 'terrazzo', 'wood', 'paper', 'sand', 'leather', 'brushed', 'noise'];

/**
 * Materials. Soft materials (fabric, velvet, linen, sand, leather) are a height field shaded by a
 * light from the top-left: this is what makes folds read like a photo instead of noise.
 * c1 = shadow colour, c2 = main colour.
 */
const TEXTURE_SKSL = `
uniform float2 res;
uniform float kind;
uniform half4 c1;
uniform half4 c2;
uniform float scale;
uniform float contrast;
uniform float angle;
uniform float seed;
${NOISE}

float folds(vec2 p, float k) {
  // Domain-warped low frequency field: long soft folds like draped cloth.
  vec2 q = vec2(fbm3(p * 0.55 + seed), fbm3(p * 0.55 + vec2(5.2, 1.3) + seed));
  return fbm3(p * 0.38 + q * 1.6 * k);
}

float height(vec2 p, float kd) {
  if (kd < 0.5) return folds(p, 1.0);
  if (kd < 1.5) return folds(p * 0.85, 1.25);
  if (kd < 2.5) return folds(p * 1.2, 0.8) * 0.8;
  if (kd < 9.5 && kd > 8.5) return sin((p.y + fbm3(p * 0.7) * 1.8) * 9.0) * 0.08 + fbm3(p * 0.6) * 0.6;
  if (kd > 9.5 && kd < 10.5) return (1.0 - cell(p * 9.0)) * 0.12 + fbm3(p * 0.8) * 0.5;
  return 0.0;
}

half4 main(vec2 xy) {
  float S = max(scale, 0.05);
  vec2 p = rot(xy / max(res.y, 1.0), angle) * S * 4.0;
  vec2 px = rot(xy, angle);
  float kd = kind;
  float soft = (kd < 2.5 || (kd > 8.5 && kd < 10.5)) ? 1.0 : 0.0;
  float v = 0.5;
  float spec = 0.0;
  if (soft > 0.5) {
    float e = 0.004 * S * 4.0;
    float h = height(p, kd);
    float hx = height(p + vec2(e, 0.0), kd);
    float hy = height(p + vec2(0.0, e), kd);
    float amp = kd < 1.5 ? 14.0 : 9.0;
    vec3 n = normalize(vec3((h - hx) * amp / (e * 40.0), (h - hy) * amp / (e * 40.0), 1.0));
    vec3 L = normalize(vec3(-0.55, -0.65, 0.75));
    float diff = clamp(dot(n, L), 0.0, 1.0);
    v = 0.18 + diff * 0.82;
    if (kd > 0.5 && kd < 1.5) {
      // velvet: fibres catch light at grazing angles (rim sheen) and deepen in the valleys
      float rim = pow(1.0 - n.z, 1.4);
      v = v * 0.75 + rim * 0.9;
      v = v * (0.92 + 0.08 * hash(px * 0.5));
    } else if (kd < 0.5) {
      // woven threads at pixel scale
      float wv = sin(px.x * 1.9) * sin(px.y * 1.9);
      v += wv * 0.035 + (vnoise(px * vec2(0.9, 0.12)) - 0.5) * 0.06;
    } else if (kd < 2.5) {
      v += (vnoise(px * vec2(0.08, 1.1)) - 0.5) * 0.08 + (vnoise(px * vec2(1.1, 0.08)) - 0.5) * 0.08;
      v += (fbm3(px * vec2(0.02, 0.4)) - 0.5) * 0.08;
    } else if (kd < 9.5) {
      v += (hash(px) - 0.5) * 0.12;
    } else {
      v += (vnoise(px * 0.6) - 0.5) * 0.06;
    }
    spec = pow(clamp(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 18.0) * (kd > 9.5 ? 0.25 : 0.0);
  } else if (kd < 3.5) { // concrete
    float n = fbm(p * 1.4) * 0.55 + fbm(p * 7.0) * 0.25;
    float pores = smoothstep(0.78, 0.84, vnoise(px * 0.18)) * 0.5 + smoothstep(0.86, 0.9, hash(floor(px * 0.5))) * 0.3;
    float stain = smoothstep(0.35, 0.75, fbm3(p * 0.4 + 7.0)) * 0.12;
    v = 0.35 + n * 0.55 - pores * 0.22 - stain + (hash(px) - 0.5) * 0.05;
  } else if (kd < 4.5) { // stone slab
    float w = fbm(p * 0.9);
    float c = cell(p * 1.6 + w * 0.8);
    v = 0.45 + smoothstep(0.0, 0.9, c) * 0.25 + fbm(p * 5.0) * 0.25 + (hash(px) - 0.5) * 0.06;
  } else if (kd < 5.5) { // marble
    float t = p.x * 0.9 + p.y * 0.45 + fbm(p * 1.1) * 3.2;
    float vein = 1.0 - pow(abs(sin(t * 3.14159)), 0.12);
    float fine = 1.0 - pow(abs(sin((t * 2.7 + fbm(p * 3.0) * 2.0) * 3.14159)), 0.35);
    v = 0.92 - vein * 0.55 - fine * 0.12 + fbm(p * 4.0) * 0.08;
  } else if (kd < 6.5) { // terrazzo
    vec2 g = floor(p * 5.0);
    float c = cell(p * 5.0);
    float chip = smoothstep(0.24 + hash(g) * 0.1, 0.2 + hash(g) * 0.1, c);
    float tone = hash(g + 3.7);
    v = 0.78 + fbm(p * 12.0) * 0.08 - chip * (0.25 + tone * 0.5);
  } else if (kd < 7.5) { // wood
    float w = fbm(p * vec2(0.35, 2.0));
    float r = p.y * 2.2 + w * 2.2 + fbm3(p * vec2(0.2, 1.0)) * 1.4;
    float rings = abs(fract(r * 2.2) - 0.5) * 2.0;
    v = 0.42 + smoothstep(0.1, 0.9, rings) * 0.32 + (vnoise(px * vec2(0.03, 0.9)) - 0.5) * 0.18 + fbm(p * vec2(1.0, 18.0)) * 0.12;
  } else if (kd < 8.5) { // paper
    v = 0.86 + (fbm(p * 3.0) - 0.5) * 0.08 + (vnoise(px * 0.35) - 0.5) * 0.06 + (vnoise(px * vec2(0.05, 0.6)) - 0.5) * 0.04;
  } else if (kd < 11.5) { // brushed metal
    v = 0.55 + (vnoise(px * vec2(0.004, 0.6)) - 0.5) * 0.35 + (vnoise(px * vec2(0.002, 0.15)) - 0.5) * 0.25 + (fbm3(p * 0.6) - 0.5) * 0.25;
  } else {
    v = 0.5 + (hash(px) - 0.5) * 0.6;
  }
  v = clamp((v - 0.5) * (0.55 + contrast * 1.3) + 0.5, 0.0, 1.0);
  half4 col = mix(c1, c2, half(v));
  return half4(col.rgb + half(spec), col.a);
}
`;

const LIGHT_PATTERNS: LightPattern[] = ['none', 'window', 'blinds', 'leaves', 'spot', 'side', 'top', 'rays'];

/**
 * Light over the whole composition as a grey value for an overlay blend: >0.5 brightens,
 * <0.5 darkens. Patterns are soft (penumbra) like real sunlight through a window or foliage.
 */
const LIGHT_SKSL = `
uniform float2 res;
uniform float kind;
uniform float angle;
uniform float intensity;
uniform float softness;
uniform float shadeAmt;
uniform half4 tint;
${NOISE}
half4 main(vec2 xy) {
  vec2 q = (xy - res * 0.5) / max(res.x, res.y);
  vec2 d = rot(q, -angle);
  float s = 0.004 + softness * 0.06;
  float L = 0.5;
  if (kind < 1.5) { // window: four panes projected at an angle
    vec2 w = d * vec2(1.0, 1.35) + vec2(0.18, 0.05);
    w.x += w.y * 0.45;
    vec2 g = abs(fract(w * 1.5 + 0.5) - 0.5);
    float inside = smoothstep(0.5 - 0.035 - s, 0.5 - 0.035 + s, 0.5 - max(g.x, g.y) + 0.5 - 0.5) ;
    float pane = smoothstep(0.035 + s, 0.035 - s, max(0.0, 0.5 - max(g.x, g.y)) * 0.0 + 0.0) * 0.0;
    float bars = smoothstep(0.03, 0.03 + s * 1.5, min(0.5 - g.x, 0.5 - g.y));
    float frameMask = smoothstep(0.62 + s * 2.0, 0.62 - s * 2.0, max(abs(w.x * 1.5), abs(w.y * 1.5)) * 0.75);
    L = bars * frameMask + inside * 0.0 + pane;
  } else if (kind < 2.5) { // blinds
    float st = abs(fract(d.y * 14.0) - 0.5) * 2.0;
    float slat = smoothstep(0.35 - s * 6.0, 0.35 + s * 6.0, st);
    float mask = smoothstep(0.75, 0.35, abs(d.x + d.y * 0.4));
    L = slat * mask;
  } else if (kind < 3.5) { // leaves: dappled foliage shadow
    vec2 p = d * 4.0 + vec2(3.1, 1.7);
    float n = fbm(p + vec2(fbm3(p * 0.7), fbm3(p * 0.7 + 4.0)) * 0.8);
    float spots = smoothstep(0.5 - s * 3.0, 0.5 + s * 3.0, n);
    L = mix(1.0, 0.0, spots * smoothstep(-0.7, 0.2, d.x));
    L = 1.0 - (1.0 - L) * 0.95;
  } else if (kind < 4.5) { // spot
    L = smoothstep(0.62 + softness * 0.3, 0.05, length(q - rot(vec2(0.0, -0.08), angle)));
  } else if (kind < 5.5) { // side light
    L = smoothstep(-0.55 - softness * 0.3, 0.55 + softness * 0.3, d.x);
  } else if (kind < 6.5) { // top light
    L = smoothstep(0.65, -0.55, q.y);
  } else { // rays
    vec2 o = rot(vec2(0.55, -0.75), angle * 0.3);
    float a = atan(q.y - o.y, q.x - o.x);
    float ray = sin(a * 26.0 + fbm3(vec2(a * 4.0, 1.0)) * 5.0) * 0.5 + 0.5;
    L = ray * smoothstep(1.5, 0.1, length(q - o));
  }
  // light (>0.5) and shadow (<0.5) around neutral grey
  float g = 0.5 + (L - 0.5) * intensity;
  g -= (1.0 - L) * shadeAmt * 0.18 * intensity;
  half3 c = half3(g);
  c = mix(c, c * tint.rgb * 1.6, half(clamp(L, 0.0, 1.0) * 0.25 * intensity));
  return half4(c, 1.0);
}
`;

const GRAIN_SKSL = `
uniform float2 res;
uniform float seed;
${NOISE}
half4 main(vec2 xy) {
  float n = hash(xy * 0.731 + seed);
  float m = hash(xy * 1.37 + seed + 3.3);
  float g = (n + m) * 0.5;
  return half4(half3(g), 1.0);
}
`;

let cache: { texture: SkRuntimeEffect | null; light: SkRuntimeEffect | null; grain: SkRuntimeEffect | null } | null = null;

export function effects() {
  if (!cache) {
    cache = {
      texture: Skia.RuntimeEffect.Make(TEXTURE_SKSL),
      light: Skia.RuntimeEffect.Make(LIGHT_SKSL),
      grain: Skia.RuntimeEffect.Make(GRAIN_SKSL),
    };
  }
  return cache;
}

export const textureIndex = (t: TextureId) => Math.max(0, TEXTURE_IDS.indexOf(t));
export const lightIndex = (p: LightPattern) => Math.max(0, LIGHT_PATTERNS.indexOf(p));
export { LIGHT_PATTERNS, TEXTURE_IDS };
export const SKSL = { TEXTURE_SKSL, LIGHT_SKSL, GRAIN_SKSL };
