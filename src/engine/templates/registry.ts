import type { Template } from './index';

/** All templates (filled by ./library.ts when it is imported). */
export const TEMPLATES: Template[] = [];

export function registerTemplates(list: Template[]) {
  for (const t of list) if (!TEMPLATES.some((x) => x.id === t.id)) TEMPLATES.push(t);
}

export const templateById = (id: string) => TEMPLATES.find((t) => t.id === id);
