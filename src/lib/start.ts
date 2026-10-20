import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { clone, uid } from '../engine/defaults';
import { templateById, type Template } from '../engine/templates';
import type { DeviceLayer, Layer, Scene } from '../engine/types';
import { tr } from '../i18n';
import { useProjects } from '../store/projects';
import { toast } from '../store/ui';
import { persistImage } from './files';
import { deviceFor, sceneFromCaptures, type CaptureInput, type CaptureKind } from './smart';

/** Captures waiting for a template choice (Home › Importer → Modèles). */
let pendingCaptures: { caps: CaptureInput[]; kind: CaptureKind; label?: string } | null = null;
export const setPendingCaptures = (p: typeof pendingCaptures) => (pendingCaptures = p);
export const getPendingCaptures = () => pendingCaptures;

/** Fills a template's screens with captures; extra captures become extra pages in the same style. */
export function fillScenes(base: Scene, caps: CaptureInput[], kind: CaptureKind, label?: string): Scene[] {
  const screens = base.layers.filter((l) => l.kind === 'device').length || 1;
  const pages: Scene[] = [];
  for (let i = 0; i < Math.max(1, Math.ceil(caps.length / screens)); i++) {
    const sc = clone(base);
    sc.id = uid('s');
    let k = i * screens;
    sc.layers = sc.layers.map((l): Layer => {
      const n = { ...l, id: uid(l.kind[0]) } as Layer;
      if (n.kind === 'device') {
        const c = caps[k++];
        if (c) {
          const fit = deviceFor(c, kind).fit;
          n.screen = { ...(n as DeviceLayer).screen, uri: c.uri, iw: c.w, ih: c.h, fit: kind === 'web' ? 'top' : fit === 'top' ? 'top' : n.screen.fit, scroll: 0, label: label ?? n.screen.label };
        }
      }
      return n;
    });
    pages.push(sc);
  }
  return pages;
}

export function openTemplate(t: Template) {
  const pending = pendingCaptures;
  pendingCaptures = null;
  const base = t.build();
  const pages = pending?.caps.length ? fillScenes(base, pending.caps, pending.kind, pending.label) : [base];
  const p = useProjects.getState().create(pending?.label ?? t.name, pages, 'template');
  router.push({ pathname: '/editor', params: { project: p.id } });
}

export function openTemplateId(id: string) {
  const t = templateById(id);
  if (t) openTemplate(t);
}

/** Creates a project from captures (copied into the app's storage). */
export async function projectFromCaptures(caps: CaptureInput[], kind: CaptureKind, label?: string, templateId?: string) {
  const stored = await Promise.all(caps.map(async (c) => ({ ...c, uri: await persistImage(c.uri) })));
  const t = templateId ? templateById(templateId) : undefined;
  const pages = t ? fillScenes(t.build(), stored, kind, label) : sceneFromCaptures(stored, kind, label);
  return useProjects.getState().create(label ?? tr('project.untitled'), pages, kind);
}

/** Opens the editor on new captures (smart scene, or the given template). */
export async function openCaptures(caps: CaptureInput[], kind: CaptureKind, label?: string, templateId?: string) {
  if (!caps.length) return;
  const p = await projectFromCaptures(caps, kind, label, templateId);
  router.push({ pathname: '/editor', params: { project: p.id } });
}

/** Picks images from the gallery. */
export async function pickImages(multiple = true): Promise<CaptureInput[]> {
  try {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: multiple, selectionLimit: multiple ? 30 : 1, quality: 1, exif: false });
    if (res.canceled) return [];
    return res.assets.map((a) => ({ uri: a.uri, w: a.width, h: a.height }));
  } catch {
    toast(tr('common.pickError'), 'error');
    return [];
  }
}

export async function importAndOpen() {
  const caps = await pickImages(true);
  if (caps.length) await openCaptures(caps, 'image');
}

export function newBlank() {
  router.push('/templates');
}
