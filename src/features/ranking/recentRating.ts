import { create } from 'zustand';

/** Se conserva solo en memoria para reconocer la última calificación al volver al ranking. */
export const useRecentRating = create<{
  key: string | null;
  mark: (slug: string, id: number) => void;
  clear: () => void;
}>()((set) => ({
  key: null,
  mark: (slug, id) => set({ key: `${slug}-${id}` }),
  clear: () => set({ key: null }),
}));
