import { File } from 'expo-file-system';
import { useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';
import { create } from 'zustand';
import { renderScene } from '../engine/export';
import type { Scene } from '../engine/types';
import { fontProvider } from './fonts';
import { thumbsDir, writeBase64 } from './files';

/** Bump when the renderer changes so old thumbnails are regenerated. */
const VERSION = 'v1';
const WIDTH = 420;

type ThumbState = { map: Record<string, string | null> };
const useThumbStore = create<ThumbState>(() => ({ map: {} }));

type Job = { key: string; scene: () => Scene; width: number };
const queue: Job[] = [];
const queued = new Set<string>();
let running = false;

async function pump() {
  if (running) return;
  running = true;
  // Text layers need the fonts: wait a little for them on first use.
  for (let i = 0; i < 30 && !fontProvider(); i++) await new Promise((r) => setTimeout(r, 100));
  while (queue.length) {
    const job = queue.shift()!;
    // Let touches and animations run between two renders.
    await new Promise<void>((r) => InteractionManager.runAfterInteractions(() => r()));
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    try {
      const scene = job.scene();
      const scale = job.width / scene.width;
      const out = await renderScene(scene, fontProvider(), { scale, format: 'jpg', quality: 0.86 });
      const uri = writeBase64(`${job.key}.jpg`, out.base64, thumbsDir());
      useThumbStore.setState((s) => ({ map: { ...s.map, [job.key]: `${uri}?t=${Date.now()}` } }));
    } catch {
      useThumbStore.setState((s) => ({ map: { ...s.map, [job.key]: null } }));
    } finally {
      queued.delete(job.key);
    }
  }
  running = false;
}

function cachedFile(key: string): string | null {
  try {
    const f = new File(thumbsDir(), `${key}.jpg`);
    return f.exists ? f.uri : null;
  } catch {
    return null;
  }
}

/** Queues a render unless a cached file exists. `force` re-renders (project edited). */
export function requestThumb(key: string, scene: () => Scene, opts: { force?: boolean; width?: number; priority?: boolean } = {}) {
  const k = `${key}-${VERSION}`;
  if (!opts.force) {
    const known = useThumbStore.getState().map[k];
    if (known !== undefined) return;
    const file = cachedFile(k);
    if (file) {
      useThumbStore.setState((s) => ({ map: { ...s.map, [k]: file } }));
      return;
    }
  }
  if (queued.has(k)) return;
  queued.add(k);
  const job = { key: k, scene, width: opts.width ?? WIDTH };
  if (opts.priority) queue.unshift(job);
  else queue.push(job);
  pump();
}

/** Thumbnail uri for a key (undefined while rendering). */
export function useThumb(key: string, scene: () => Scene, opts: { force?: number; width?: number } = {}) {
  const k = `${key}-${VERSION}`;
  const uri = useThumbStore((s) => s.map[k]);
  const [forced, setForced] = useState(opts.force);
  useEffect(() => {
    const force = opts.force !== undefined && opts.force !== forced;
    if (force) setForced(opts.force);
    requestThumb(key, scene, { force, width: opts.width });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, opts.force]);
  return uri;
}
