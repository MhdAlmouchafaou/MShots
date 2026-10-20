import { router } from 'expo-router';
import { create } from 'zustand';
import { Native, type Capture } from '../../../modules/mshots-core';

type CaptureState = {
  captures: Capture[];
  loaded: boolean;
  running: boolean;
  /** Current bubble session (captures of this run). */
  session: string | null;
  refresh: () => Promise<void>;
  remove: (uris: string[]) => Promise<void>;
};

export const useCaptures = create<CaptureState>((set, get) => ({
  captures: [],
  loaded: false,
  running: !!Native?.bubbleRunning(),
  session: null,
  refresh: async () => {
    if (!Native) return set({ loaded: true });
    try {
      const captures = await Native.listCaptures(null);
      set({ captures, loaded: true, running: Native.bubbleRunning() });
    } catch {
      set({ loaded: true });
    }
  },
  remove: async (uris) => {
    if (!Native || !uris.length) return;
    await Native.deleteCaptures(uris);
    set({ captures: get().captures.filter((c) => !uris.includes(c.uri)) });
  },
}));

let attached = false;

/** Listens to the native capture events once for the whole app. */
export function attachCaptureEvents() {
  if (!Native || attached) return;
  attached = true;
  Native.addListener('onCapture', (c) => useCaptures.setState((s) => ({ captures: [c, ...s.captures.filter((x) => x.uri !== c.uri)] })));
  Native.addListener('onBubble', (e) => useCaptures.setState({ running: e.running }));
}

export type EditorCapture = { uri: string; w: number; h: number; label?: string | null; preset?: string };

/** Opens the editor with one or several captures (the editor picks devices/templates). */
export function openInEditor(items: EditorCapture[], kind: 'web' | 'app' | 'image') {
  if (!items.length) return;
  if (items.length === 1) {
    const c = items[0];
    router.push({ pathname: '/editor', params: { capture: c.uri, w: String(c.w), h: String(c.h), kind, label: c.label ?? '', preset: c.preset ?? '' } } as never);
  } else {
    router.push({ pathname: '/editor', params: { captures: JSON.stringify(items), kind } } as never);
  }
}

export const newSessionId = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
};
