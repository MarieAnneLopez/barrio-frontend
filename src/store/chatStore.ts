import { create } from 'zustand';
import type { AvatarEvent } from '../lib/avatarStateMachine';
import { askMarie, type ChatContext, type RemoteReply } from '../lib/chatApi';
import { localReply, type LocalReply } from '../lib/chatLocalReplies';
import { useAvatarStore } from './avatarStore';

export type ChatMessage =
  | { id: number; from: 'user'; text: string }
  /** Saludo contextual o respuesta local cuando el servidor no responde (offline). */
  | { id: number; from: 'marie'; reply: LocalReply; offline?: boolean }
  /** Respuesta del ModelProvider del backend (H23). */
  | { id: number; from: 'marie'; remote: RemoteReply };

interface ChatStore {
  open: boolean;
  messages: ChatMessage[];
  /** Esperando la respuesta del servidor: no se envía otra pregunta a la vez. */
  pending: boolean;
  setOpen: (open: boolean) => void;
  /** Saludo contextual al abrir; no se repite si el usuario sigue en la misma sección. */
  greet: (placeKey: string) => void;
  send: (text: string, context: ChatContext) => Promise<void>;
  reset: () => void;
}

/** Gesto del avatar que pide cada respuesta del backend. */
const REACTION: Record<RemoteReply['expresion'], AvatarEvent['type'] | null> = {
  wave: 'GREET', jump: 'CELEBRATE', alert: 'ALERT', sad: 'ERROR', idle: null,
};
const react = (type: AvatarEvent['type'] | null) => {
  if (type) useAvatarStore.getState().dispatch({ type } as AvatarEvent);
};

let nextId = 1;

/** Conversación con Mini Marie: /api/v1/chat y, sin conexión, el repertorio local (H13). */
export const useChatStore = create<ChatStore>()((set, get) => ({
  open: false,
  messages: [],
  pending: false,
  setOpen: (open) => {
    if (open && !get().open) react('GREET');
    set({ open });
  },
  greet: (placeKey) =>
    set((s) => {
      const last = [...s.messages].reverse().find((m) => 'reply' in m && m.reply.key === 'chat.greeting');
      if (last && 'reply' in last && last.reply.params?.placeKey === placeKey) return s;
      const reply = { key: 'chat.greeting', params: { placeKey } };
      return { messages: [...s.messages, { id: nextId++, from: 'marie', reply }] };
    }),
  send: async (text, context) => {
    const clean = text.trim();
    if (!clean || get().pending) return;
    set((s) => ({ pending: true, messages: [...s.messages, { id: nextId++, from: 'user', text: clean }] }));
    let message: ChatMessage;
    try {
      const remote = await askMarie(clean, context);
      message = { id: nextId++, from: 'marie', remote };
      react(REACTION[remote.expresion]);
    } catch {
      const reply = localReply(clean);
      message = { id: nextId++, from: 'marie', reply, offline: true };
      react(reply.alert ? 'ALERT' : 'GREET');
    }
    set((s) => ({ pending: false, messages: [...s.messages, message] }));
  },
  reset: () => set({ open: false, messages: [], pending: false }),
}));
