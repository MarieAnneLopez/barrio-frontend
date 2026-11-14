import { useEffect } from 'react';
import { create } from 'zustand';
import { AVATAR_STATES, transition, type AvatarEvent, type AvatarState } from '../lib/avatarStateMachine';

interface AvatarStore {
  state: AvatarState;
  dispatch: (event: AvatarEvent) => void;
}

/** Estado global de Mini Marie (chat, carga, reacciones a la navegación). */
export const useAvatarStore = create<AvatarStore>()((set) => ({
  state: 'idle',
  dispatch: (event) => set((s) => ({ state: transition(s.state, event) })),
}));

/** Devuelve los gestos de un solo uso a idle cuando se cumple su duración. */
export function useAvatarSettle(): void {
  const state = useAvatarStore((s) => s.state);
  const dispatch = useAvatarStore((s) => s.dispatch);
  useEffect(() => {
    const hold = AVATAR_STATES[state].holdMs;
    if (hold === null) return undefined;
    const timer = window.setTimeout(() => dispatch({ type: 'SETTLE' }), hold);
    return () => window.clearTimeout(timer);
  }, [state, dispatch]);
}
