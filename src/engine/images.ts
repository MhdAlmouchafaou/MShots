import { Skia, type SkImage } from '@shopify/react-native-skia';
import { useEffect, useState } from 'react';

/** Decoded images shared by the editor, thumbnails and export (uri → SkImage). */
const cache = new Map<string, SkImage>();
const pending = new Map<string, Promise<SkImage | null>>();

export async function loadImage(uri: string): Promise<SkImage | null> {
  const hit = cache.get(uri);
  if (hit) return hit;
  let p = pending.get(uri);
  if (!p) {
    p = Skia.Data.fromURI(uri)
      .then((d) => Skia.Image.MakeImageFromEncoded(d))
      .then((img) => {
        if (img) cache.set(uri, img);
        pending.delete(uri);
        return img;
      })
      .catch(() => {
        pending.delete(uri);
        return null;
      });
    pending.set(uri, p);
  }
  return p;
}

export function forgetImage(uri: string) {
  cache.delete(uri);
}

/** Loads every uri; returns the map (re-renders as images arrive). */
export function useImages(uris: string[]): Record<string, SkImage | null> {
  const key = uris.join('|');
  const [map, setMap] = useState<Record<string, SkImage | null>>(() => Object.fromEntries(uris.map((u) => [u, cache.get(u) ?? null])));
  useEffect(() => {
    let alive = true;
    const missing = uris.filter((u) => !cache.has(u));
    setMap(Object.fromEntries(uris.map((u) => [u, cache.get(u) ?? null])));
    if (missing.length) {
      Promise.all(missing.map(loadImage)).then(() => {
        if (alive) setMap(Object.fromEntries(uris.map((u) => [u, cache.get(u) ?? null])));
      });
    }
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return map;
}
