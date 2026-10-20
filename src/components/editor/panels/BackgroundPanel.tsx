import { Image } from 'expo-image';
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { background, linear, solid } from '../../../engine/defaults';
import type { Background, Fill, LightPattern, Scene, TextureId } from '../../../engine/types';
import { useT } from '../../../i18n';
import { persistImage } from '../../../lib/files';
import { pickImages } from '../../../lib/start';
import { useThumb } from '../../../lib/thumbs';
import { updateBackground } from '../../../store/editor';
import { FONT, useTheme } from '../../../theme';
import { PALETTE } from '../../ColorPicker';
import { Slider } from '../../Slider';
import { Button, Chip, ChipRow, Segmented, Toggle } from '../../ui';
import { ColorRow, Option, OptionGrid, Section } from './kit';

const GRADIENTS: string[][] = [
  ['#F3EDE4', '#D9CDBD'],
  ['#E6ECF2', '#B9CBDC'],
  ['#FF7A3D', '#E2410D'],
  ['#1B1D24', '#0B0B0C'],
  ['#FCE9D8', '#F6A6C1'],
  ['#E8F58A', '#9AD6FF'],
  ['#C5B5FF', '#4F8BFF'],
  ['#2F4058', '#0E1420'],
  ['#F7D774', '#FF5A1F'],
  ['#E9F3EC', '#9CC7C4'],
  ['#FFFFFF', '#E4E1DA'],
  ['#3B2A1E', '#120C08'],
];

const MESHES: { base: string; colors: string[] }[] = [
  { base: '#EFEAF6', colors: ['#9AD6FF', '#E8F58A', '#C5B5FF'] },
  { base: '#FFF3EA', colors: ['#FFB38A', '#FF5A1F', '#FCE9D8'] },
  { base: '#0E0F14', colors: ['#4F3BFF', '#00C2FF', '#1B1D24'] },
  { base: '#F2F7EF', colors: ['#B8D86B', '#9CC7C4', '#F7D774'] },
  { base: '#FBEFF4', colors: ['#F6A6C1', '#C5B5FF', '#FFE3C2'] },
  { base: '#101418', colors: ['#FF5A1F', '#8B6CFF', '#0B0B0C'] },
];

export const TEXTURES: { id: TextureId; color: string; color2: string }[] = [
  { id: 'velvet', color: '#C8B44A', color2: '#5E5313' },
  { id: 'fabric', color: '#D2C2A8', color2: '#8E7B60' },
  { id: 'linen', color: '#E6DED0', color2: '#B6AA95' },
  { id: 'concrete', color: '#D8D2C8', color2: '#9F978B' },
  { id: 'stone', color: '#C9C5BE', color2: '#6E6A64' },
  { id: 'marble', color: '#F2F0EC', color2: '#A9A49C' },
  { id: 'terrazzo', color: '#EEE8DF', color2: '#C2543A' },
  { id: 'wood', color: '#C08A5B', color2: '#6B4326' },
  { id: 'paper', color: '#F4EFE6', color2: '#CFC6B6' },
  { id: 'sand', color: '#E3CFA9', color2: '#B28F5B' },
  { id: 'leather', color: '#8A5233', color2: '#3E2213' },
  { id: 'brushed', color: '#D3D5D8', color2: '#8E9196' },
];

const kindOf = (f: Fill) => (f.type === 'radial' ? 'linear' : f.type);

const TextureSwatch = memo(function TextureSwatch({ tex }: { tex: (typeof TEXTURES)[number] }) {
  const uri = useThumb(`tex-${tex.id}-${tex.color}`, (): Scene => ({ id: 'tex', name: 'tex', width: 240, height: 240, layers: [], createdAt: 0, updatedAt: 0, background: background({ grain: 0, vignette: 0, fill: { type: 'texture', texture: tex.id, color: tex.color, color2: tex.color2, scale: 1, contrast: 0.55, angle: 0 } }) }), { width: 160 });
  return uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} /> : null;
});

function GradientSwatch({ colors, id, radial }: { colors: string[]; id: string; radial?: boolean }) {
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Defs>
        {radial ? (
          <RadialGradient id={id} cx="30%" cy="30%" r="90%">
            {colors.map((c, i) => (
              <Stop key={i} offset={i / Math.max(1, colors.length - 1)} stopColor={c} />
            ))}
          </RadialGradient>
        ) : (
          <LinearGradient id={id} x1="0" y1="0" x2="0.4" y2="1">
            {colors.map((c, i) => (
              <Stop key={i} offset={i / Math.max(1, colors.length - 1)} stopColor={c} />
            ))}
          </LinearGradient>
        )}
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

export function BackgroundPanel({ scene }: { scene: Scene }) {
  const tt = useT();
  const bg = scene.background;
  const f = bg.fill;
  const setFill = (fill: Fill, key?: string) => updateBackground({ fill }, key);
  const set = (p: Partial<Background>, key?: string) => updateBackground(p, key);
  const pick = async () => {
    const [c] = await pickImages(false);
    if (!c) return;
    setFill({ type: 'image', uri: await persistImage(c.uri), fit: 'cover', blur: 0, zoom: 1, x: 0, y: 0 });
  };
  return (
    <View>
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        <Segmented
          options={[
            { key: 'solid', label: tt('bg.solid') },
            { key: 'linear', label: tt('bg.gradient') },
            { key: 'mesh', label: tt('bg.mesh') },
            { key: 'texture', label: tt('bg.texture') },
            { key: 'image', label: tt('bg.photo') },
          ]}
          value={kindOf(f)}
          onChange={(k) => {
            if (k === 'solid') setFill(solid(f.type === 'solid' ? f.color : '#ECEAE5'));
            else if (k === 'linear') setFill(linear(GRADIENTS[0], 165));
            else if (k === 'mesh') setFill({ type: 'mesh', base: MESHES[0].base, softness: 0.6, points: MESHES[0].colors.map((color, i) => ({ color, x: [0.1, 0.9, 0.5][i], y: [0.12, 0.2, 0.95][i] })) });
            else if (k === 'texture') setFill({ type: 'texture', texture: TEXTURES[0].id, color: TEXTURES[0].color, color2: TEXTURES[0].color2, scale: 1, contrast: 0.55, angle: 0 });
            else pick();
          }}
        />
      </View>

      {f.type === 'solid' ? (
        <>
          <OptionGrid>
            {PALETTE.slice(0, 16).map((c) => (
              <Option key={c} label="" active={f.color.toUpperCase() === c} onPress={() => setFill(solid(c))}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: c }]} />
              </Option>
            ))}
          </OptionGrid>
          <ColorRow label={tt('common.color')} value={f.color} onChange={(c) => setFill(solid(c), 'solid')} />
        </>
      ) : null}

      {f.type === 'linear' || f.type === 'radial' ? (
        <>
          <OptionGrid>
            {GRADIENTS.map((g, i) => (
              <Option key={i} label="" onPress={() => setFill(f.type === 'radial' ? { ...f, stops: g.map((color, j) => ({ color, pos: j / (g.length - 1) })) } : linear(g, f.angle))}>
                <GradientSwatch colors={g} id={`g${i}`} radial={f.type === 'radial'} />
              </Option>
            ))}
          </OptionGrid>
          <View style={{ paddingHorizontal: 16, paddingTop: 6 }}>
            <Segmented
              options={[
                { key: 'linear', label: tt('bg.linear') },
                { key: 'radial', label: tt('bg.radial') },
              ]}
              value={f.type}
              onChange={(k) => setFill(k === 'radial' ? { type: 'radial', stops: f.stops, cx: 0.5, cy: 0.35, r: 0.8 } : { type: 'linear', stops: f.stops, angle: 165 })}
            />
          </View>
          {f.stops.map((s, i) => (
            <ColorRow key={i} label={tt('bg.stop', { n: i + 1 })} value={s.color} onChange={(c) => setFill({ ...f, stops: f.stops.map((x, j) => (j === i ? { ...x, color: c } : x)) } as Fill, `stop${i}`)} />
          ))}
          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16 }}>
            {f.stops.length < 5 ? <Button small kind="secondary" icon="plus" label={tt('bg.addStop')} onPress={() => setFill({ ...f, stops: [...f.stops.map((s, j) => ({ ...s, pos: j / f.stops.length })), { color: f.stops[f.stops.length - 1].color, pos: 1 }] } as Fill)} /> : null}
            {f.stops.length > 2 ? <Button small kind="ghost" icon="minus" label={tt('bg.removeStop')} onPress={() => setFill({ ...f, stops: f.stops.slice(0, -1).map((s, j, a) => ({ ...s, pos: j / (a.length - 1) })) } as Fill)} /> : null}
          </View>
          {f.type === 'linear' ? <Slider label={tt('bg.angle')} value={f.angle} min={0} max={360} step={1} format={(v) => `${Math.round(v)}°`} onChange={(v) => setFill({ ...f, angle: v }, 'angle')} /> : null}
          {f.type === 'radial' ? (
            <>
              <Slider label={tt('bg.centerX')} value={f.cx} min={0} max={1} format={(v) => `${Math.round(v * 100)} %`} onChange={(v) => setFill({ ...f, cx: v }, 'cx')} />
              <Slider label={tt('bg.centerY')} value={f.cy} min={0} max={1} format={(v) => `${Math.round(v * 100)} %`} onChange={(v) => setFill({ ...f, cy: v }, 'cy')} />
              <Slider label={tt('bg.radius')} value={f.r} min={0.1} max={2} format={(v) => `${Math.round(v * 100)} %`} onChange={(v) => setFill({ ...f, r: v }, 'r')} />
            </>
          ) : null}
        </>
      ) : null}

      {f.type === 'mesh' ? (
        <>
          <OptionGrid>
            {MESHES.map((m, i) => (
              <Option key={i} label="" onPress={() => setFill({ ...f, base: m.base, points: m.colors.map((color, j) => ({ color, x: f.points[j]?.x ?? Math.random(), y: f.points[j]?.y ?? Math.random() })) })}>
                <GradientSwatch colors={[m.colors[0], m.colors[1], m.colors[2] ?? m.base]} id={`m${i}`} radial />
              </Option>
            ))}
          </OptionGrid>
          <ColorRow label={tt('bg.base')} value={f.base} onChange={(c) => setFill({ ...f, base: c }, 'base')} />
          {f.points.map((p, i) => (
            <ColorRow key={i} label={tt('bg.spot', { n: i + 1 })} value={p.color} onChange={(c) => setFill({ ...f, points: f.points.map((x, j) => (j === i ? { ...x, color: c } : x)) }, `pt${i}`)} />
          ))}
          <View style={{ paddingHorizontal: 16 }}>
            <Button small kind="secondary" icon="refresh" label={tt('bg.shuffle')} onPress={() => setFill({ ...f, points: f.points.map((p) => ({ ...p, x: Math.random(), y: Math.random() })) })} />
          </View>
          <Slider label={tt('bg.softness')} value={f.softness} min={0} max={1} format={(v) => `${Math.round(v * 100)} %`} onChange={(v) => setFill({ ...f, softness: v }, 'soft')} />
        </>
      ) : null}

      {f.type === 'texture' ? (
        <>
          <OptionGrid>
            {TEXTURES.map((x) => (
              <Option key={x.id} label={tt(`tex.${x.id}`)} active={f.texture === x.id} onPress={() => setFill({ ...f, texture: x.id, color: x.color, color2: x.color2 })}>
                <TextureSwatch tex={x} />
              </Option>
            ))}
          </OptionGrid>
          <ColorRow label={tt('bg.light')} value={f.color} onChange={(c) => setFill({ ...f, color: c }, 'tc1')} />
          <ColorRow label={tt('bg.dark')} value={f.color2} onChange={(c) => setFill({ ...f, color2: c }, 'tc2')} />
          <Slider label={tt('bg.scale')} value={f.scale} min={0.2} max={4} format={(v) => `${v.toFixed(1)}×`} onChange={(v) => setFill({ ...f, scale: v }, 'tscale')} />
          <Slider label={tt('bg.contrast')} value={f.contrast} min={0} max={1} format={(v) => `${Math.round(v * 100)} %`} onChange={(v) => setFill({ ...f, contrast: v }, 'tcon')} />
          <Slider label={tt('bg.angle')} value={f.angle} min={0} max={180} step={1} format={(v) => `${Math.round(v)}°`} onChange={(v) => setFill({ ...f, angle: v }, 'tang')} />
        </>
      ) : null}

      {f.type === 'image' ? (
        <>
          <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
            <Button small icon="images" label={tt('bg.changePhoto')} onPress={pick} />
          </View>
          <Slider label={tt('bg.blur')} value={f.blur} min={0} max={80} step={1} format={(v) => `${Math.round(v)}`} onChange={(v) => setFill({ ...f, blur: v }, 'iblur')} />
          <Slider label={tt('screen.zoom')} value={f.zoom} min={1} max={3} format={(v) => `${v.toFixed(2)}×`} onChange={(v) => setFill({ ...f, zoom: v }, 'izoom')} />
          <Slider label={tt('bg.offsetX')} value={f.x} min={-0.5} max={0.5} origin={0} format={(v) => `${Math.round(v * 100)}`} onChange={(v) => setFill({ ...f, x: v }, 'ix')} />
          <Slider label={tt('bg.offsetY')} value={f.y} min={-0.5} max={0.5} origin={0} format={(v) => `${Math.round(v * 100)}`} onChange={(v) => setFill({ ...f, y: v }, 'iy')} />
        </>
      ) : null}

      <Section title={tt('bg.adjust')}>
        <Slider label={tt('bg.brightness')} value={bg.brightness} min={-1} max={1} origin={0} format={(v) => `${Math.round(v * 100)}`} onChange={(v) => set({ brightness: v }, 'bright')} />
        <Slider label={tt('bg.contrast')} value={bg.contrast} min={-1} max={1} origin={0} format={(v) => `${Math.round(v * 100)}`} onChange={(v) => set({ contrast: v }, 'contrast')} />
        <Slider label={tt('bg.saturation')} value={bg.saturation} min={-1} max={1} origin={0} format={(v) => `${Math.round(v * 100)}`} onChange={(v) => set({ saturation: v }, 'sat')} />
        <Slider label={tt('bg.temperature')} value={bg.temperature} min={-1} max={1} origin={0} format={(v) => `${Math.round(v * 100)}`} onChange={(v) => set({ temperature: v }, 'temp')} />
        <Slider label={tt('bg.grain')} value={bg.grain} min={0} max={1} format={(v) => `${Math.round(v * 100)} %`} onChange={(v) => set({ grain: v }, 'grain')} />
        <Slider label={tt('bg.vignette')} value={bg.vignette} min={0} max={1} format={(v) => `${Math.round(v * 100)} %`} onChange={(v) => set({ vignette: v }, 'vig')} />
      </Section>
      <TransparentRow value={!!bg.transparent} onChange={(v) => set({ transparent: v })} label={tt('bg.transparent')} />
    </View>
  );
}

function TransparentRow({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 54 }}>
      <Text style={{ fontSize: 14.5, fontFamily: FONT.medium, color: t.text, flex: 1 }}>{label}</Text>
      <Toggle value={value} onChange={onChange} />
    </View>
  );
}

const PATTERNS: LightPattern[] = ['none', 'window', 'blinds', 'leaves', 'spot', 'side', 'top', 'rays'];

export function LightPanel({ scene }: { scene: Scene }) {
  const tt = useT();
  const l = scene.background.light;
  const set = (p: Partial<Background['light']>, key?: string) => updateBackground((b) => ({ light: { ...b.light, ...p } }), key);
  return (
    <View>
      <ChipRow>
        {PATTERNS.map((p) => (
          <Chip key={p} label={tt(`light.${p}`)} active={l.pattern === p} onPress={() => set({ pattern: p, intensity: l.intensity || 0.5 })} />
        ))}
      </ChipRow>
      {l.pattern !== 'none' ? (
        <>
          <Slider label={tt('light.intensity')} value={l.intensity} min={0} max={1.5} format={(v) => `${Math.round(v * 100)} %`} onChange={(v) => set({ intensity: v }, 'lint')} />
          <Slider label={tt('light.angle')} value={l.angle} min={-180} max={180} step={1} origin={0} format={(v) => `${Math.round(v)}°`} onChange={(v) => set({ angle: v }, 'lang')} />
          <Slider label={tt('light.softness')} value={l.softness} min={0} max={1} format={(v) => `${Math.round(v * 100)} %`} onChange={(v) => set({ softness: v }, 'lsoft')} />
          <Slider label={tt('light.shade')} value={l.shade} min={0} max={1} format={(v) => `${Math.round(v * 100)} %`} onChange={(v) => set({ shade: v }, 'lshade')} />
          <ColorRow label={tt('light.color')} value={l.color} onChange={(c) => set({ color: c }, 'lcolor')} />
        </>
      ) : null}
    </View>
  );
}
