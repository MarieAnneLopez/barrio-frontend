import { apiGet, apiSend } from './apiClient';

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
  lugar?: string | null;
  fuentes?: { titulo: string; url: string; consultado_en: string }[];
}

/** Lo que el agente percibe del usuario además del mensaje. */
export interface ChatContext {
  idioma: 'es' | 'en';
  ruta: string;
  contexto_lugar?: string;
}

/** Un único POST; el límite también cubre la lectura del cuerpo de respuesta. */
export async function askMarie(mensaje: string, context: ChatContext): Promise<RemoteReply> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('Tiempo agotado')), 15_000);
    });
    const reply = await Promise.race([apiSend<RemoteReply>('POST', '/chat', { mensaje, ...context }, 15_000), timeout]);
    if (!reply || typeof reply.texto !== 'string' || !reply.texto.trim()
      || !Array.isArray(reply.acciones) || !reply.acciones.every((a) => a && typeof a.etiqueta === 'string'
        && typeof a.ruta === 'string' && /^\/(?![/\\])/.test(a.ruta))
      || !Array.isArray(reply.sugerencias) || !reply.sugerencias.every((s) => typeof s === 'string')
      || (reply.fuentes != null && (!Array.isArray(reply.fuentes) || !reply.fuentes.every((s) =>
        s && typeof s.titulo === 'string' && typeof s.url === 'string' && typeof s.consultado_en === 'string')))) {
      throw new Error('Respuesta inválida del chat');
    }
    return reply;
  } finally {
    clearTimeout(timer);
  }
}

/** GET /api/v1/chat/estado (H36): proveedor externo que recibe los mensajes, o null. */
export interface ChatStatus {
  proveedor: 'gemini' | 'claude' | 'desconocido' | null;
}

let status: Promise<ChatStatus> | null = null;

/** Una consulta por carga; si falla (API dormida) se asume sin proveedor y se vuelve a preguntar luego. */
export function chatStatus(): Promise<ChatStatus> {
  status ??= apiGet<ChatStatus>('/chat/estado').catch(() => {
    status = null;
    return { proveedor: 'desconocido' as const };
  });
  return status;
}
