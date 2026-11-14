import { apiSend } from './apiClient';

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

export async function askMarie(mensaje: string, context: ChatContext): Promise<RemoteReply> {
  const reply = await apiSend<RemoteReply>('POST', '/chat', { mensaje, ...context });
  if (!reply) throw new Error('Respuesta vacía del chat');
  return reply;
}
