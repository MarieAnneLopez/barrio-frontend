import { ApiError, apiGet, apiSend } from './apiClient';

/** Respuesta de POST /api/v1/chat (ModelProvider del backend, H22). Llega ya en el idioma pedido. */
export interface RemoteReply {
  intent: string;
  texto: string;
  expresion: 'idle' | 'wave' | 'jump' | 'alert' | 'sad';
  /** analitico, generativo, generativo:respaldo o moe:… (para saber qué ambiente respondió). */
  modelo: string;
  experto: string | null;
  acciones: { ruta: string; etiqueta: string }[];
  sugerencias: string[];
}

/** Lo que el agente percibe del usuario además del mensaje. */
export interface ChatContext {
  idioma: 'es' | 'en';
  ruta: string;
}

/** El proxy espera hasta ~50 s a que la API despierte (D82): el chat la espera. */
const CHAT_TIMEOUT_MS = 55_000;
/** Pedido de Marie (D82): si una consulta falla, se reintenta en silencio 2 veces. */
export const chatRetry = { delaysMs: [1000, 2000] };
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
/** Solo se reintenta lo que puede pasar solo: red caída o error 5xx. */
const transient = (error: unknown) => !(error instanceof ApiError) || error.status === 0 || error.status >= 500;

async function askOnce(mensaje: string, context: ChatContext): Promise<RemoteReply> {
  const reply = await apiSend<RemoteReply>('POST', '/chat', { mensaje, ...context }, CHAT_TIMEOUT_MS);
  if (!reply) throw new Error('Respuesta vacía del chat');
  return reply;
}

export async function askMarie(mensaje: string, context: ChatContext): Promise<RemoteReply> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await askOnce(mensaje, context);
    } catch (error) {
      const delay = chatRetry.delaysMs[attempt];
      if (delay === undefined || !transient(error)) throw error;
      await pause(delay);
    }
  }
}

/** GET /api/v1/chat/estado (H36): proveedor externo que recibe los mensajes, o null. */
export interface ChatStatus {
  proveedor: 'gemini' | 'claude' | null;
}

let status: Promise<ChatStatus> | null = null;

/** Una consulta por carga; si falla (API dormida) se asume sin proveedor y se vuelve a preguntar luego. */
export function chatStatus(): Promise<ChatStatus> {
  status ??= apiGet<ChatStatus>('/chat/estado').catch(() => {
    status = null;
    return { proveedor: null };
  });
  return status;
}
