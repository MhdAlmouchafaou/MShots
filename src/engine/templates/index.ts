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

export { registerTemplates, templateById, TEMPLATES } from './registry';

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

// Loads the built-in library (registers its templates).
import './library';
