import { create } from 'zustand';
import { ApiError } from '../lib/apiClient';
import type { AvatarEvent } from '../lib/avatarStateMachine';
import { askMarie, type ChatContext, type RemoteReply } from '../lib/chatApi';
import { localReply, type LocalReply } from '../lib/chatLocalReplies';
import { useAvatarStore } from './avatarStore';

export type ChatMessage =
  | { id: number; from: 'user'; text: string }
  /** Saludo contextual u orientación disponible sin conexión. */
  | { id: number; from: 'marie'; reply: LocalReply }
  /** Respuesta del ModelProvider del backend (H23). */
  | { id: number; from: 'marie'; remote: RemoteReply };

interface ChatStore {
  open: boolean;
  messages: ChatMessage[];
  /** Esperando la respuesta del servidor: no se envía otra pregunta a la vez. */
  pending: boolean;
  draft: string;
  setDraft: (draft: string) => void;
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
let generation = 0;
let lastPlace: string | undefined;

/** Conversación con Mini Marie: /api/v1/chat y, si no contesta, respuestas locales (H13, D82). */
export const useChatStore = create<ChatStore>()((set, get) => ({
  open: false,
  messages: [],
  pending: false,
  draft: '',
  setDraft: (draft) => set({ draft }),
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
    const reply = localReply(clean, lastPlace);
    if (reply.key === 'chat.replies.urgent' || /^[¡!¿?\s]*(hola|buenas|hello|hi|hey|saludos|ayuda|help)[¡!¿?.\s]*$/i.test(clean)) {
      set((s) => ({ messages: [...s.messages, { id: nextId++, from: 'user', text: clean }, { id: nextId++, from: 'marie', reply }] }));
      return;
    }
    set((s) => ({ pending: true, messages: [...s.messages, { id: nextId++, from: 'user', text: clean }] }));
    const current = ++generation;
    const guidanceId = nextId++;
    const timer = setTimeout(() => {
      if (generation !== current) return;
      set((s) => ({ messages: [...s.messages, { id: guidanceId, from: 'marie', reply }] }));
    }, 5_000);
    let message: ChatMessage;
    try {
      const remote = await askMarie(clean, { ...context, ...(lastPlace ? { contexto_lugar: lastPlace } : {}) });
      if (generation !== current) return;
      lastPlace = remote.lugar ?? undefined;
      message = { id: guidanceId, from: 'marie', remote };
      react(REACTION[remote.expresion]);
    } catch (error) {
      if (generation !== current) return;
      if (error instanceof ApiError && error.status === 429) {
        message = { id: guidanceId, from: 'marie', reply: { ...reply, limited: true } };
      } else {
        if (reply.key.startsWith('chat.replies.library')) lastPlace = 'Biblioteca Pública El Tintal Manuel Zapata Olivella';
        message = { id: guidanceId, from: 'marie', reply };
        react(reply.alert ? 'ALERT' : 'GREET');
      }
    } finally {
      clearTimeout(timer);
    }
    set((s) => ({ pending: false, messages: s.messages.some((m) => m.id === guidanceId)
      ? s.messages.map((m) => m.id === guidanceId ? message : m) : [...s.messages, message] }));
  },
  reset: () => { generation += 1; lastPlace = undefined; set({ open: false, messages: [], pending: false, draft: '' }); },
}));
