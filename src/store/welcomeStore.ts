import { create } from 'zustand';

const SEEN_KEY = 'mini-marie:welcome-seen';

function seenThisSession(): boolean {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === 'true';
  } catch {
    return false;
  }
}

function markSeen(): void {
  try {
    window.sessionStorage.setItem(SEEN_KEY, 'true');
  } catch {
    // Sin almacenamiento: la bienvenida podría repetirse al recargar; nada más.
  }
}

interface WelcomeStore {
  open: boolean;
  /** Primera visita de la sesión (D11): se abre si aún no se vio. */
  openIfFirstVisit: () => void;
  /** Botón "Repetir bienvenida" del header. */
  replay: () => void;
  close: () => void;
}

export const useWelcomeStore = create<WelcomeStore>()((set) => ({
  open: false,
  openIfFirstVisit: () => {
    if (!seenThisSession()) set({ open: true });
  },
  replay: () => set({ open: true }),
  close: () => {
    markSeen();
    set({ open: false });
  },
}));
