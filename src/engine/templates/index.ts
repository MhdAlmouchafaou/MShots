import type { Scene } from '../types';

export type TemplateCategory = 'phone' | 'tablet' | 'laptop' | 'desktop' | 'multi' | 'scene' | 'social' | 'store' | 'watch' | 'tv' | 'web';

export type Template = {
  id: string;
  name: string;
  category: TemplateCategory;
  tags: string[];
  /** Number of screens the template expects (devices with a screen). */
  screens: number;
  /** Builds a fresh scene (new ids each call). */
  build: () => Scene;
  /** Pro/featured flag for the gallery. */
  featured?: boolean;
};

/** Filled by the template library (see ./library.ts). */
export const TEMPLATES: Template[] = [];

export const TEMPLATE_CATEGORIES: { id: TemplateCategory; label: string }[] = [
  { id: 'phone', label: 'Téléphones' },
  { id: 'tablet', label: 'Tablettes' },
  { id: 'laptop', label: 'Portables' },
  { id: 'desktop', label: 'Écrans' },
  { id: 'multi', label: 'Multi-appareils' },
  { id: 'scene', label: 'Scènes réalistes' },
  { id: 'social', label: 'Réseaux sociaux' },
  { id: 'store', label: 'App Store / Play' },
  { id: 'web', label: 'Sites web' },
  { id: 'watch', label: 'Montres' },
  { id: 'tv', label: 'TV' },
];

export function registerTemplates(list: Template[]) {
  for (const t of list) if (!TEMPLATES.some((x) => x.id === t.id)) TEMPLATES.push(t);
}

export const templateById = (id: string) => TEMPLATES.find((t) => t.id === id);
