import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';
import { renderScene, type ExportOptions } from '../engine/export';
import type { Scene } from '../engine/types';
import { tr } from '../i18n';
import { setBusy, toast } from '../store/ui';
import { writeBase64 } from './files';
import { fontProvider } from './fonts';

export type ExportSettings = ExportOptions & { transparent: boolean };

const safe = (s: string) => s.replace(/[^\w\-]+/g, '_').slice(0, 40) || 'mshots';

async function renderToFile(scene: Scene, o: ExportSettings, name: string) {
  const s = o.transparent ? { ...scene, background: { ...scene.background, transparent: true } } : scene;
  const format = o.transparent && o.format === 'jpg' ? 'png' : o.format;
  const out = await renderScene(s, fontProvider(), { ...o, format });
  return writeBase64(`${name}.${format === 'jpg' ? 'jpg' : format}`, out.base64);
}

async function album(): Promise<MediaLibrary.Album | null> {
  try {
    return await MediaLibrary.getAlbumAsync('MShots');
  } catch {
    return null;
  }
}

/** Saves pages to the gallery (album "MShots"). Returns the number saved. */
export async function saveToGallery(pages: Scene[], o: ExportSettings, projectName: string) {
  const perm = await MediaLibrary.requestPermissionsAsync(true, ['photo']);
  if (!perm.granted) {
    toast(tr('export.permission'), 'error');
    return 0;
  }
  let done = 0;
  try {
    let a = await album();
    for (let i = 0; i < pages.length; i++) {
      setBusy({ text: pages.length > 1 ? tr('export.progressN', { i: i + 1, n: pages.length }) : tr('export.progress'), progress: (i + 0.3) / pages.length });
      const uri = await renderToFile(pages[i], o, `${safe(projectName)}-${Date.now()}-${i + 1}`);
      const asset = await MediaLibrary.createAssetAsync(uri);
      if (!a) a = await MediaLibrary.createAlbumAsync('MShots', asset, false);
      else await MediaLibrary.addAssetsToAlbumAsync([asset], a, false);
      done++;
    }
    toast(tr('export.saved', { count: done }), 'ok');
  } catch {
    toast(tr('export.failed'), 'error');
  } finally {
    setBusy(null);
  }
  return done;
}

export async function sharePage(page: Scene, o: ExportSettings, projectName: string) {
  try {
    setBusy({ text: tr('export.progress'), progress: 0.4 });
    const uri = await renderToFile(page, o, `${safe(projectName)}-${Date.now()}`);
    setBusy(null);
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: o.format === 'jpg' && !o.transparent ? 'image/jpeg' : o.format === 'webp' ? 'image/webp' : 'image/png' });
  } catch {
    setBusy(null);
    toast(tr('export.failed'), 'error');
  }
}
