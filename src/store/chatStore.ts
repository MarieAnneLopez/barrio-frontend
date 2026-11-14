import { create } from 'zustand';
import { localReply, type LocalReply } from '../lib/chatLocalReplies';
import { useAvatarStore } from './avatarStore';

export type ChatMessage =
  | { id: number; from: 'user'; text: string }
  | { id: number; from: 'marie'; reply: LocalReply };

interface ChatStore {
  open: boolean;
  messages: ChatMessage[];
  setOpen: (open: boolean) => void;
  /** Saludo contextual al abrir; no se repite si el usuario sigue en la misma sección. */
  greet: (placeKey: string) => void;
  /** Envía el mensaje del usuario y agrega la respuesta local de Mini Marie. */
  send: (text: string) => void;
  reset: () => void;
}

let nextId = 1;

/** Conversación con Mini Marie (H13: respuestas locales; H23: /api/v1/chat). */
export const useChatStore = create<ChatStore>()((set, get) => ({
  open: false,
  messages: [],
  setOpen: (open) => {
    if (open && !get().open) useAvatarStore.getState().dispatch({ type: 'GREET' });
    set({ open });
  },
  greet: (placeKey) =>
    set((s) => {
      const last = [...s.messages]
        .reverse()
        .find((m) => m.from === 'marie' && m.reply.key === 'chat.greeting');
      if (last?.from === 'marie' && last.reply.params?.placeKey === placeKey) return s;
      const reply = { key: 'chat.greeting', params: { placeKey } };
      return { messages: [...s.messages, { id: nextId++, from: 'marie', reply }] };
    }),
  send: (text) => {
    const clean = text.trim();
    if (!clean) return;
    const reply = localReply(clean);
    useAvatarStore.getState().dispatch({ type: reply.alert ? 'ALERT' : 'GREET' });
    set((s) => ({
      messages: [
        ...s.messages,
        { id: nextId++, from: 'user', text: clean },
        { id: nextId++, from: 'marie', reply },
      ],
    }));
  },
  reset: () => set({ open: false, messages: [] }),
}));
