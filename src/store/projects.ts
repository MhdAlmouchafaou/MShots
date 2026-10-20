import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { clone, uid } from '../engine/defaults';
import type { Scene } from '../engine/types';

export type Project = {
  id: string;
  name: string;
  /** One or more pages (scenes) exported together. */
  pages: Scene[];
  createdAt: number;
  updatedAt: number;
  /** Thumbnail file uri (first page), refreshed after edits. */
  thumb?: string | null;
  source?: 'web' | 'app' | 'image' | 'template' | 'blank';
};

type ProjectsState = {
  projects: Record<string, Project>;
  order: string[];
  hydrated: boolean;
  create: (name: string, pages: Scene[], source?: Project['source']) => Project;
  save: (p: Project) => void;
  setPages: (id: string, pages: Scene[]) => void;
  rename: (id: string, name: string) => void;
  duplicate: (id: string) => Project | null;
  remove: (id: string) => void;
  setThumb: (id: string, thumb: string | null) => void;
};

export const useProjects = create<ProjectsState>()(
  persist(
    (set, get) => ({
      projects: {},
      order: [],
      hydrated: false,
      create: (name, pages, source) => {
        const now = Date.now();
        const p: Project = { id: uid('p'), name, pages, createdAt: now, updatedAt: now, thumb: null, source };
        set((s) => ({ projects: { ...s.projects, [p.id]: p }, order: [p.id, ...s.order] }));
        return p;
      },
      save: (p) => set((s) => ({ projects: { ...s.projects, [p.id]: { ...p, updatedAt: Date.now() } }, order: [p.id, ...s.order.filter((x) => x !== p.id)] })),
      setPages: (id, pages) =>
        set((s) => {
          const p = s.projects[id];
          if (!p) return s;
          return { projects: { ...s.projects, [id]: { ...p, pages, updatedAt: Date.now() } }, order: [id, ...s.order.filter((x) => x !== id)] };
        }),
      rename: (id, name) =>
        set((s) => (s.projects[id] ? { projects: { ...s.projects, [id]: { ...s.projects[id], name, updatedAt: Date.now() } } } : s)),
      duplicate: (id) => {
        const src = get().projects[id];
        if (!src) return null;
        const now = Date.now();
        const p: Project = { ...clone(src), id: uid('p'), name: `${src.name} (2)`, createdAt: now, updatedAt: now };
        p.pages = p.pages.map((pg) => ({ ...pg, id: uid('s') }));
        set((s) => ({ projects: { ...s.projects, [p.id]: p }, order: [p.id, ...s.order] }));
        return p;
      },
      remove: (id) =>
        set((s) => {
          const projects = { ...s.projects };
          delete projects[id];
          return { projects, order: s.order.filter((x) => x !== id) };
        }),
      setThumb: (id, thumb) => set((s) => (s.projects[id] ? { projects: { ...s.projects, [id]: { ...s.projects[id], thumb } } } : s)),
    }),
    {
      name: 'mshots-projects',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ projects: s.projects, order: s.order }),
      onRehydrateStorage: () => () => useProjects.setState({ hydrated: true }),
    }
  )
);
