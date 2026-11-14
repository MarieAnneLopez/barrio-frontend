import { create } from 'zustand';

/**
 * Cargas en curso (H24): cada petición o carga diferida es una tarea con su
 * avance real de 0 a 1. Las terminadas quedan en 1 hasta que acaba el lote,
 * para que el promedio nunca retroceda; con todas listas, el lote se vacía.
 */
interface LoadingStore {
  tasks: Record<number, number>;
  begin: () => number;
  update: (id: number, value: number) => void;
  end: (id: number) => void;
}

let nextId = 1;
const clamp = (value: number) => Math.min(1, Math.max(0, value));

export const useLoadingStore = create<LoadingStore>()((set) => ({
  tasks: {},
  begin: () => {
    const id = nextId++;
    set((s) => ({ tasks: { ...s.tasks, [id]: 0 } }));
    return id;
  },
  update: (id, value) =>
    set((s) => (id in s.tasks ? { tasks: { ...s.tasks, [id]: Math.max(s.tasks[id] ?? 0, clamp(value)) } } : s)),
  end: (id) =>
    set((s) => {
      if (!(id in s.tasks)) return s;
      const tasks = { ...s.tasks, [id]: 1 };
      return { tasks: Object.values(tasks).every((v) => v === 1) ? {} : tasks };
    }),
}));

/** Avance del lote actual (0–1) y si hay algo cargando. */
export function loadingSnapshot(tasks: Record<number, number>) {
  const values = Object.values(tasks);
  const active = values.length > 0;
  return { active, progress: active ? values.reduce((a, b) => a + b, 0) / values.length : 1 };
}
