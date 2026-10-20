import { Directory, File, Paths } from 'expo-file-system';

function dir(name: string) {
  const d = new Directory(Paths.document, name);
  if (!d.exists) d.create({ intermediates: true, idempotent: true });
  return d;
}

export const mediaDir = () => dir('media');
export const exportsDir = () => {
  const d = new Directory(Paths.cache, 'exports');
  if (!d.exists) d.create({ intermediates: true, idempotent: true });
  return d;
};
export const thumbsDir = () => {
  const d = new Directory(Paths.cache, 'thumbs');
  if (!d.exists) d.create({ intermediates: true, idempotent: true });
  return d;
};

const ext = (uri: string) => {
  const m = uri.split('?')[0].match(/\.(png|jpe?g|webp|heic|gif)$/i);
  return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : 'png';
};

/** Copies an image into the app's documents (survives cache clears). Already-persisted files are kept as is. */
export async function persistImage(uri: string): Promise<string> {
  try {
    const target = mediaDir();
    if (uri.startsWith(target.uri)) return uri;
    const f = new File(target, `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}.${ext(uri)}`);
    await new File(uri).copy(f);
    return f.uri;
  } catch {
    return uri;
  }
}

/** Writes base64 data to a cache file and returns its uri. */
export function writeBase64(name: string, base64: string, d: Directory = exportsDir()): string {
  const f = new File(d, name);
  if (f.exists) f.delete();
  f.create();
  f.write(base64, { encoding: 'base64' });
  return f.uri;
}

export function fileExists(uri: string) {
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}
