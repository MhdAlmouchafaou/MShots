import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EditorCanvas } from '../components/editor/EditorCanvas';
import { ExportSheet } from '../components/editor/ExportSheet';
import { BackgroundPanel, LightPanel } from '../components/editor/panels/BackgroundPanel';
import { DevicePanel } from '../components/editor/panels/DevicePanel';
import { ImagePanel } from '../components/editor/panels/ImagePanel';
import { FormatPanel, LayersPanel, layerName } from '../components/editor/panels/LayersPanel';
import { replaceScreen, ScreenPanel } from '../components/editor/panels/ScreenPanel';
import { editText, ShapePanel, TextPanel } from '../components/editor/panels/TextPanel';
import { ShadowPanel, TiltPanel } from '../components/editor/panels/TiltPanel';
import { Icon, type IconName } from '../components/Icon';
import { IconButton, PressScale, tap } from '../components/ui';
import { templateById } from '../engine/templates';
import type { Layer } from '../engine/types';
import { useT } from '../i18n';
import { persistImage } from '../lib/files';
import { deliverCapture, hasCaptureTarget } from '../lib/handoff';
import { pickImages, projectFromCaptures } from '../lib/start';
import type { CaptureInput, CaptureKind } from '../lib/smart';
import {
  addPage,
  applyStyleToAll,
  closeProject,
  duplicateLayer,
  duplicatePage,
  flushSave,
  moveLayer,
  openProject,
  redo,
  removeLayer,
  removePage,
  setPage,
  undo,
  useEditor,
} from '../store/editor';
import { useProjects } from '../store/projects';
import { showConfirm, showPrompt, showSheet, toast } from '../store/ui';
import { FONT, useTheme } from '../theme';
import { fadeIn } from '../theme/motion';

type Tool = 'device' | 'screen' | 'tilt' | 'shadow' | 'background' | 'light' | 'text' | 'shapes' | 'image' | 'layers' | 'format';

const TOOL_ICON: Record<Tool, IconName> = {
  device: 'phone',
  screen: 'screen',
  tilt: 'cube',
  shadow: 'shadow',
  background: 'background',
  light: 'light',
  text: 'text',
  shapes: 'shapes',
  image: 'images',
  layers: 'layers',
  format: 'format',
};

const GLOBAL: Tool[] = ['background', 'light', 'device', 'text', 'shapes', 'image', 'layers', 'format'];

function toolsFor(l: Layer | null): Tool[] {
  const own: Tool[] = !l ? [] : l.kind === 'device' ? ['device', 'screen', 'tilt', 'shadow'] : l.kind === 'text' ? ['text'] : l.kind === 'image' ? ['image', 'tilt', 'shadow'] : ['shapes', 'shadow'];
  return [...own, ...GLOBAL.filter((g) => !own.includes(g))];
}

export default function Editor() {
  const t = useTheme();
  const tt = useT();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const params = useLocalSearchParams<{ project?: string; template?: string; captures?: string; capture?: string; w?: string; h?: string; preset?: string; kind?: string; label?: string }>();
  const projectId = useEditor((s) => s.projectId);
  const pages = useEditor((s) => s.pages);
  const page = useEditor((s) => s.page);
  const selected = useEditor((s) => s.selected);
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  const name = useProjects((s) => (projectId ? s.projects[projectId]?.name : '') ?? '');
  const [tool, setTool] = useState<Tool>('device');
  const [exporting, setExporting] = useState(false);
  const opened = useRef(false);
  const mine = useRef(false);

  // Open (or create) the project from the route params.
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    if (params.project) {
      mine.current = true;
      if (!openProject(params.project)) {
        toast(tt('editor.missing'), 'error');
        router.back();
      }
      return;
    }
    if (params.captures || params.capture) {
      try {
        const raw = params.captures
          ? (JSON.parse(params.captures) as (CaptureInput | string)[])
          : [{ uri: params.capture!, w: Number(params.w) || undefined, h: Number(params.h) || undefined, label: params.label || undefined, preset: params.preset || undefined }];
        const caps = raw.map((c) => (typeof c === 'string' ? { uri: c } : c));
        // An editor is waiting for a new screen image: hand it over and go back to it.
        if (hasCaptureTarget()) {
          const c = caps[0];
          deliverCapture({ ...c, label: c.label ?? params.label ?? undefined });
          router.back();
          return;
        }
        mine.current = true;
        const label = params.label || caps.find((c) => c.label)?.label || undefined;
        projectFromCaptures(caps, (params.kind as CaptureKind) ?? 'image', label, params.template).then((p) => openProject(p.id));
      } catch {
        router.back();
      }
      return;
    }
    if (params.template) {
      const tp = templateById(params.template);
      if (tp) {
        mine.current = true;
        const p = useProjects.getState().create(tp.name, [tp.build()], 'template');
        openProject(p.id);
      } else router.back();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only the instance that opened the project closes it.
  useEffect(() => () => {
    if (mine.current) closeProject();
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      flushSave();
      return false;
    });
    return () => sub.remove();
  }, []);

  const scene = pages[page];
  const layer = scene && selected ? scene.layers.find((l) => l.id === selected) ?? null : null;
  const tools = useMemo(() => toolsFor(layer), [layer?.kind]);

  // Selecting another kind of layer opens its main tool.
  const lastKind = useRef<string | null>(null);
  useEffect(() => {
    const k = layer?.kind ?? null;
    if (k === lastKind.current) return;
    lastKind.current = k;
    setTool(k === 'device' ? 'device' : k === 'text' ? 'text' : k === 'image' ? 'image' : k === 'shape' ? 'shapes' : 'background');
  }, [layer?.kind]);

  if (!scene) return <View style={{ flex: 1, backgroundColor: t.bg }} />;

  const panelH = Math.round(Math.max(230, Math.min(380, height * 0.36)));
  const device = layer?.kind === 'device' ? layer : null;
  const tiltable = layer && (layer.kind === 'device' || layer.kind === 'image') ? layer : null;
  const shadowed = layer && layer.kind !== 'text' ? layer : null;

  const panel = (() => {
    switch (tool) {
      case 'device':
        return <DevicePanel scene={scene} layer={device} />;
      case 'screen':
        return device ? <ScreenPanel layer={device} /> : null;
      case 'tilt':
        return tiltable ? <TiltPanel layer={tiltable} /> : null;
      case 'shadow':
        return shadowed ? <ShadowPanel layer={shadowed} /> : null;
      case 'background':
        return <BackgroundPanel scene={scene} />;
      case 'light':
        return <LightPanel scene={scene} />;
      case 'text':
        return <TextPanel scene={scene} layer={layer?.kind === 'text' ? layer : null} />;
      case 'shapes':
        return <ShapePanel scene={scene} layer={layer?.kind === 'shape' ? layer : null} />;
      case 'image':
        return <ImagePanel scene={scene} layer={layer?.kind === 'image' ? layer : null} />;
      case 'layers':
        return <LayersPanel scene={scene} selected={selected} />;
      case 'format':
        return <FormatPanel scene={scene} />;
    }
  })();

  const onDoubleTap = (l: Layer) => {
    if (l.kind === 'device') replaceScreen(l);
    else if (l.kind === 'text') editText(l, tt('text.edit'));
  };

  const pagesMenu = () =>
    showSheet({
      title: tt('pages.title'),
      subtitle: tt('pages.sub'),
      actions: [
        {
          label: tt('pages.addScreens'),
          icon: 'images',
          onPress: async () => {
            const caps = await pickImages(true);
            for (const c of caps) addPage(await persistImage(c.uri), c.w && c.h ? { w: c.w, h: c.h } : undefined);
            if (caps.length) toast(tt('pages.added', { count: caps.length }), 'ok');
          },
        },
        { label: tt('pages.duplicate'), icon: 'copy', onPress: duplicatePage },
        { label: tt('pages.applyAll'), icon: 'wand', onPress: () => (applyStyleToAll(), toast(tt('pages.applied'), 'ok')) },
        ...(pages.length > 1 ? [{ label: tt('pages.delete'), icon: 'trash', destructive: true, onPress: () => showConfirm({ title: tt('pages.deleteQ'), confirmLabel: tt('common.delete'), destructive: true, onConfirm: () => removePage(page) }) }] : []),
      ],
    });

  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <View style={styles.top}>
        <IconButton
          icon="back"
          onPress={() => {
            flushSave();
            router.back();
          }}
        />
        <PressScale
          style={styles.nameWrap}
          onPress={() => projectId && showPrompt({ title: tt('project.rename'), initial: name, onSubmit: (v) => v.trim() && useProjects.getState().rename(projectId, v.trim()) })}
        >
          <Text numberOfLines={1} style={[styles.name, { color: t.text }]}>
            {name || tt('project.untitled')}
          </Text>
          <Text style={[styles.dims, { color: t.textTertiary }]}>
            {scene.width}×{scene.height}
            {pages.length > 1 ? ` · ${page + 1}/${pages.length}` : ''}
          </Text>
        </PressScale>
        <IconButton icon="undo" disabled={!canUndo} onPress={undo} label={tt('editor.undo')} />
        <IconButton icon="redo" disabled={!canRedo} onPress={redo} label={tt('editor.redo')} />
        <PressScale onPress={() => setExporting(true)} style={[styles.export, { backgroundColor: t.accent }]}>
          <Icon name="download" size={18} color="#fff" strokeWidth={2.2} />
          <Text style={styles.exportText}>{tt('editor.export')}</Text>
        </PressScale>
      </View>

      <EditorCanvas scene={scene} selected={selected} onDoubleTap={onDoubleTap} />

      <View style={styles.pagesRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flex: 1 }} contentContainerStyle={styles.pagesContent}>
          {pages.map((p, i) => (
            <PressScale key={p.id} onPress={() => setPage(i)} onLongPress={pagesMenu} style={[styles.pageChip, { backgroundColor: i === page ? t.chipActive : t.chip }]}>
              <Text style={[styles.pageText, { color: i === page ? t.onInk : t.text }]}>{i + 1}</Text>
            </PressScale>
          ))}
          <PressScale onPress={pagesMenu} style={[styles.pageChip, { backgroundColor: t.chip, paddingHorizontal: 12, width: undefined, flexDirection: 'row', gap: 6 }]}>
            <Icon name="pages" size={16} color={t.text} strokeWidth={2} />
            <Text style={[styles.pageText, { color: t.text }]}>{tt('pages.short')}</Text>
          </PressScale>
        </ScrollView>
        {layer ? (
          <View style={styles.layerActions}>
            <Text numberOfLines={1} style={[styles.layerName, { color: t.textSecondary }]}>
              {layerName(layer, tt)}
            </Text>
            <IconButton size={36} iconSize={18} icon="up" onPress={() => moveLayer(layer.id, 1)} label={tt('layers.forward')} />
            <IconButton size={36} iconSize={18} icon="copy" onPress={() => duplicateLayer(layer.id)} label={tt('layers.duplicate')} />
            <IconButton size={36} iconSize={18} icon="trash" color={t.danger} onPress={() => removeLayer(layer.id)} label={tt('layers.delete')} />
          </View>
        ) : null}
      </View>

      <View style={[styles.panel, { height: panelH, backgroundColor: t.surface }]}>
        <ScrollView key={`${tool}-${layer?.id ?? 'none'}`} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 18 }}>
          <Animated.View entering={fadeIn()}>{panel}</Animated.View>
        </ScrollView>
      </View>

      <View style={[styles.toolbar, { backgroundColor: t.surface, paddingBottom: insets.bottom + 6, borderTopColor: t.divider }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.toolsContent}>
          {tools.map((k) => {
            const on = k === tool;
            return (
              <PressScale
                key={k}
                scaleTo={0.92}
                onPress={() => {
                  if (!on) tap('selection');
                  setTool(k);
                }}
                style={styles.tool}
              >
                <View style={[styles.toolIcon, { backgroundColor: on ? t.ink : 'transparent' }]}>
                  <Icon name={TOOL_ICON[k]} size={21} color={on ? t.onInk : t.icon} strokeWidth={on ? 2.1 : 1.8} />
                </View>
                <Text numberOfLines={1} style={[styles.toolLabel, { color: on ? t.text : t.textSecondary }]}>
                  {tt(`tool.${k}`)}
                </Text>
              </PressScale>
            );
          })}
        </ScrollView>
      </View>

      <ExportSheet visible={exporting} onClose={() => setExporting(false)} pages={pages} page={page} name={name} />
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, height: 56, gap: 2 },
  nameWrap: { flex: 1, paddingHorizontal: 6 },
  name: { fontSize: 16, fontFamily: FONT.displayBold, letterSpacing: -0.3 },
  dims: { fontSize: 11.5, fontFamily: FONT.medium, marginTop: 1 },
  export: { height: 40, borderRadius: 20, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 4, marginRight: 4 },
  exportText: { color: '#fff', fontSize: 14, fontFamily: FONT.semi },
  pagesRow: { flexDirection: 'row', alignItems: 'center', height: 48, paddingRight: 6 },
  pagesContent: { alignItems: 'center', gap: 6, paddingHorizontal: 12 },
  pageChip: { height: 32, minWidth: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  pageText: { fontSize: 13, fontFamily: FONT.semi },
  layerActions: { flexDirection: 'row', alignItems: 'center', maxWidth: '58%' },
  layerName: { fontSize: 12.5, fontFamily: FONT.semi, marginRight: 2, flexShrink: 1 },
  panel: { borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: 'hidden' },
  toolbar: { borderTopWidth: StyleSheet.hairlineWidth },
  toolsContent: { paddingHorizontal: 8, paddingTop: 6, gap: 2 },
  tool: { width: 66, alignItems: 'center', paddingVertical: 2 },
  toolIcon: { width: 44, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  toolLabel: { fontSize: 11, fontFamily: FONT.semi, marginTop: 3 },
});
