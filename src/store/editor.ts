import { create } from 'zustand';
import { clone, uid } from '../engine/defaults';
import type { Background, DeviceLayer, Layer, Scene } from '../engine/types';
import { useProjects } from './projects';

const MAX_HISTORY = 80;
/** Edits with the same key within this delay are merged into one undo step (slider drags). */
const MERGE_MS = 700;

type EditorState = {
  projectId: string | null;
  pages: Scene[];
  page: number;
  selected: string | null;
  past: Scene[][];
  future: Scene[][];
  lastKey: string | null;
  lastAt: number;
  /** Incremented on every change (thumbnails, autosave). */
  rev: number;
};

export const useEditor = create<EditorState>(() => ({
  projectId: null,
  pages: [],
  page: 0,
  selected: null,
  past: [],
  future: [],
  lastKey: null,
  lastAt: 0,
  rev: 0,
}));

const get = () => useEditor.getState();

export function openProject(id: string) {
  const p = useProjects.getState().projects[id];
  if (!p) return false;
  const first = p.pages[0]?.layers.find((l) => l.kind === 'device') ?? p.pages[0]?.layers[p.pages[0].layers.length - 1];
  useEditor.setState({ projectId: id, pages: p.pages, page: 0, selected: first?.id ?? null, past: [], future: [], lastKey: null, lastAt: 0, rev: 0 });
  return true;
}

export function closeProject() {
  flushSave();
  useEditor.setState({ projectId: null, pages: [], selected: null, past: [], future: [] });
}

export const currentScene = () => {
  const s = get();
  return s.pages[s.page];
};

/** Applies a change to the current page. `key` merges consecutive edits of the same control. */
export function edit(fn: (scene: Scene) => Scene, key?: string) {
  const s = get();
  const scene = s.pages[s.page];
  if (!scene) return;
  const next = fn(scene);
  if (next === scene) return;
  const now = Date.now();
  const merge = !!key && key === s.lastKey && now - s.lastAt < MERGE_MS;
  const pages = s.pages.slice();
  pages[s.page] = { ...next, updatedAt: now };
  useEditor.setState({
    pages,
    past: merge ? s.past : [...s.past.slice(-MAX_HISTORY + 1), s.pages],
    future: [],
    lastKey: key ?? null,
    lastAt: now,
    rev: s.rev + 1,
  });
  scheduleSave();
}

/** Change applied to every page at once (one undo step). */
export function editAll(fn: (scene: Scene, i: number) => Scene) {
  const s = get();
  const pages = s.pages.map((p, i) => fn(p, i));
  useEditor.setState({ pages, past: [...s.past.slice(-MAX_HISTORY + 1), s.pages], future: [], lastKey: null, rev: s.rev + 1 });
  scheduleSave();
}

export function updateLayer<T extends Layer>(id: string, patch: Partial<T> | ((l: T) => Partial<T>), key?: string) {
  edit((scene) => {
    const i = scene.layers.findIndex((l) => l.id === id);
    if (i < 0) return scene;
    const l = scene.layers[i] as T;
    const p = typeof patch === 'function' ? patch(l) : patch;
    const layers = scene.layers.slice();
    layers[i] = { ...l, ...p } as Layer;
    return { ...scene, layers };
  }, key ? `${id}:${key}` : undefined);
}

export function updateScreen(id: string, patch: Partial<DeviceLayer['screen']>, key?: string) {
  updateLayer<DeviceLayer>(id, (l) => ({ screen: { ...l.screen, ...patch } }), key ? `screen:${key}` : undefined);
}

export function updateShadow(id: string, patch: Partial<DeviceLayer['shadow']>, key?: string) {
  updateLayer<Layer & { shadow: DeviceLayer['shadow'] }>(id, (l) => ({ shadow: { ...l.shadow, ...patch } }) as never, key ? `shadow:${key}` : undefined);
}

export function updateBackground(patch: Partial<Background> | ((b: Background) => Partial<Background>), key?: string) {
  edit((scene) => ({ ...scene, background: { ...scene.background, ...(typeof patch === 'function' ? patch(scene.background) : patch) } }), key ? `bg:${key}` : undefined);
}

export function addLayer(layer: Layer) {
  edit((scene) => ({ ...scene, layers: [...scene.layers, layer] }));
  useEditor.setState({ selected: layer.id });
}

export function removeLayer(id: string) {
  edit((scene) => ({ ...scene, layers: scene.layers.filter((l) => l.id !== id) }));
  if (get().selected === id) useEditor.setState({ selected: null });
}

export function duplicateLayer(id: string) {
  const scene = currentScene();
  const l = scene?.layers.find((x) => x.id === id);
  if (!l || !scene) return;
  const copy = { ...clone(l), id: uid(l.kind[0]), x: l.x + scene.width * 0.04, y: l.y + scene.width * 0.04 } as Layer;
  const i = scene.layers.indexOf(l);
  edit((s) => ({ ...s, layers: [...s.layers.slice(0, i + 1), copy, ...s.layers.slice(i + 1)] }));
  useEditor.setState({ selected: copy.id });
}

/** dir: +1 = up (towards the front), -1 = down; 'top' / 'bottom'. */
export function moveLayer(id: string, dir: 1 | -1 | 'top' | 'bottom') {
  edit((scene) => {
    const layers = scene.layers.slice();
    const i = layers.findIndex((l) => l.id === id);
    if (i < 0) return scene;
    const [l] = layers.splice(i, 1);
    const j = dir === 'top' ? layers.length : dir === 'bottom' ? 0 : Math.max(0, Math.min(layers.length, i + dir));
    layers.splice(j, 0, l);
    return { ...scene, layers };
  });
}

export function select(id: string | null) {
  if (get().selected !== id) useEditor.setState({ selected: id });
}

export function undo() {
  const s = get();
  const prev = s.past[s.past.length - 1];
  if (!prev) return;
  useEditor.setState({ pages: prev, past: s.past.slice(0, -1), future: [s.pages, ...s.future], page: Math.min(s.page, prev.length - 1), lastKey: null, rev: s.rev + 1 });
  scheduleSave();
}

export function redo() {
  const s = get();
  const next = s.future[0];
  if (!next) return;
  useEditor.setState({ pages: next, future: s.future.slice(1), past: [...s.past, s.pages], page: Math.min(s.page, next.length - 1), lastKey: null, rev: s.rev + 1 });
  scheduleSave();
}

// ---------------------------------------------------------------- pages

export function setPage(i: number) {
  const s = get();
  if (i < 0 || i >= s.pages.length) return;
  const sc = s.pages[i];
  const sel = sc.layers.find((l) => l.kind === 'device') ?? sc.layers[sc.layers.length - 1];
  useEditor.setState({ page: i, selected: sel?.id ?? null });
}

/** New page with the same style; screens emptied (or filled with `uri`). */
export function addPage(uri?: string | null, size?: { w: number; h: number }) {
  const s = get();
  const base = s.pages[s.page];
  if (!base) return;
  const copy = clone(base);
  copy.id = uid('s');
  copy.layers = copy.layers.map((l) => {
    const n = { ...l, id: uid(l.kind[0]) } as Layer;
    if (n.kind === 'device') n.screen = { ...n.screen, uri: uri ?? null, iw: size?.w, ih: size?.h, scroll: 0 };
    return n;
  });
  const pages = [...s.pages.slice(0, s.page + 1), copy, ...s.pages.slice(s.page + 1)];
  useEditor.setState({ pages, page: s.page + 1, past: [...s.past, s.pages], future: [], rev: s.rev + 1 });
  scheduleSave();
}

export function duplicatePage() {
  const s = get();
  const base = s.pages[s.page];
  if (!base) return;
  const copy = clone(base);
  copy.id = uid('s');
  copy.layers = copy.layers.map((l) => ({ ...l, id: uid(l.kind[0]) }) as Layer);
  const pages = [...s.pages.slice(0, s.page + 1), copy, ...s.pages.slice(s.page + 1)];
  useEditor.setState({ pages, page: s.page + 1, past: [...s.past, s.pages], future: [], rev: s.rev + 1 });
  scheduleSave();
}

export function removePage(i: number) {
  const s = get();
  if (s.pages.length <= 1) return;
  const pages = s.pages.filter((_, j) => j !== i);
  useEditor.setState({ pages, page: Math.min(s.page, pages.length - 1), past: [...s.past, s.pages], future: [], rev: s.rev + 1 });
  scheduleSave();
}

/**
 * Applies the current page's style (background, device settings, texts style) to every page,
 * keeping each page's own screens and texts.
 */
export function applyStyleToAll() {
  const s = get();
  const src = s.pages[s.page];
  if (!src) return;
  editAll((pg, i) => {
    if (i === s.page) return pg;
    const screens = pg.layers.filter((l) => l.kind === 'device').map((l) => (l as DeviceLayer).screen);
    const texts = pg.layers.filter((l) => l.kind === 'text').map((l) => (l as Extract<Layer, { kind: 'text' }>).text);
    let di = 0;
    let ti = 0;
    const layers = src.layers.map((l) => {
      const n = { ...clone(l), id: uid(l.kind[0]) } as Layer;
      if (n.kind === 'device') {
        const sc = screens[di++];
        n.screen = sc ? { ...n.screen, uri: sc.uri, iw: sc.iw, ih: sc.ih, scroll: sc.scroll } : { ...n.screen, uri: null };
      }
      if (n.kind === 'text') {
        const tx = texts[ti++];
        if (tx !== undefined) n.text = tx;
      }
      return n;
    });
    return { ...pg, width: src.width, height: src.height, background: clone(src.background), layers };
  });
}

// ---------------------------------------------------------------- autosave

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flushSave, 900);
}

export function flushSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  const s = get();
  if (s.projectId) useProjects.getState().setPages(s.projectId, s.pages);
}
