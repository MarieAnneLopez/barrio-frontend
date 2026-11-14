import { create } from 'zustand';
import type { Usuario } from '../features/auth/authApi';

/**
 * Sesión en memoria (D58): solo quién es y su rol, nunca el token, y nada en
 * localStorage. Al recargar se recupera con GET /auth/me.
 */
interface AuthStore {
  status: 'checking' | 'anonymous' | 'signedIn';
  user: Usuario | null;
  dialogOpen: boolean;
  signIn: (user: Usuario) => void;
  signOut: () => void;
  /** La API respondió 401 con la sesión abierta: venció; se pide iniciarla de nuevo. */
  expire: () => void;
  openDialog: () => void;
  closeDialog: () => void;
}

export const useAuthStore = create<AuthStore>()((set) => ({
  status: 'checking',
  user: null,
  dialogOpen: false,
  signIn: (user) => set({ status: 'signedIn', user }),
  signOut: () => set({ status: 'anonymous', user: null }),
  expire: () => set({ status: 'anonymous', user: null, dialogOpen: true }),
  openDialog: () => set({ dialogOpen: true }),
  closeDialog: () => set({ dialogOpen: false }),
}));
