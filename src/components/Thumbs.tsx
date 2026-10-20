import { Image } from 'expo-image';
import React, { memo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Template } from '../engine/templates';
import { useThumb } from '../lib/thumbs';
import type { Project } from '../store/projects';
import { useTheme } from '../theme';

/** Live-rendered (then cached) template preview. */
export const TemplateThumb = memo(function TemplateThumb({ template, style, width }: { template: Template; style?: StyleProp<ViewStyle>; width?: number }) {
  const t = useTheme();
  const uri = useThumb(`tpl-${template.id}`, template.build, { width });
  return (
    <View style={[styles.box, { backgroundColor: t.chip }, style]}>
      {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={180} /> : null}
    </View>
  );
});

/** Project preview (first page), re-rendered after edits. */
export const ProjectThumb = memo(function ProjectThumb({ project, style }: { project: Project; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const page = project.pages[0];
  const uri = useThumb(`proj-${project.id}-${project.updatedAt}`, () => page);
  return (
    <View style={[styles.box, { backgroundColor: t.chip }, style]}>
      {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={180} /> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  box: { overflow: 'hidden' },
});
