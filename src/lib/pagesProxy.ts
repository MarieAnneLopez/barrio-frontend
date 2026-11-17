// Proxy de Cloudflare Pages hacia la API en Render (D62). Lo usa functions/api/[[path]].ts.
// El navegador solo habla con el dominio de Pages: la cookie de sesión (SameSite=Strict,
// Path=/api) sigue siendo de mismo origen y no hace falta CORS con credenciales.

export interface ProxyEnv {
  /** URL pública del backend en Render, sin barra final (p. ej. https://barrio-backend.onrender.com). */
  BACKEND_URL?: string;
  /** Misma clave que PROXY_SECRET en Render: con ella el backend cree la IP reenviada. */
  PROXY_SECRET?: string;
}

/**
 * Render gratuito se apaga tras 15 min sin uso y tarda ~40–65 s en volver (D64, D82; medido: 63,5 s): mientras
 * arranca, la conexión falla o responde 502/503/504. El proxy espera y reintenta hasta que
 * despierta (sin límite de duración en Workers HTTP; ~30 subpeticiones de 50 posibles).
 */
export const WAKE = { totalMs: 75_000, stepMs: 2_500 };
const ASLEEP = new Set([502, 503, 504]);
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Cabeceras que no se reenvían: las que solo puede poner el proxy (nadie de afuera puede hacerse
// pasar por él), las de salto a salto y las que Cloudflare añadió por el camino. Con estas
// últimas, Render respondía 502 al instante con la API dormida y no la despertaba (medido el
// 2026-11-16: 76 s de reintentos por el proxy sin efecto; la llamada directa la despertó en 53 s).
const DROPPED = new Set(['host', 'x-proxy-secret', 'x-client-ip', 'x-real-ip', 'cdn-loop', 'connection', 'keep-alive',
  'transfer-encoding', 'upgrade']);
const DROPPED_PREFIX = ['cf-', 'x-forwarded-'];

function forwardedHeaders(request: Request, env: ProxyEnv): Headers {
  const headers = new Headers();
  request.headers.forEach((value, name) => {
    const key = name.toLowerCase();
    if (!DROPPED.has(key) && !DROPPED_PREFIX.some((prefix) => key.startsWith(prefix))) headers.set(name, value);
  });
  if (env.PROXY_SECRET) {
    headers.set('x-proxy-secret', env.PROXY_SECRET);
    headers.set('x-client-ip', request.headers.get('cf-connecting-ip') ?? '');
  }
  return headers;
}

async function fetchAwake(target: URL, init: RequestInit, wake: typeof WAKE): Promise<Response | null> {
  const deadline = Date.now() + wake.totalMs;
  for (;;) {
    try {
      const response = await fetch(target, init);
      if (!ASLEEP.has(response.status) || Date.now() >= deadline) return response;
    } catch {
      if (Date.now() >= deadline) return null;
    }
    await pause(wake.stepMs);
  }
}

const json = (status: number, code: string, message: string) =>
  new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export async function proxyToBackend(request: Request, env: ProxyEnv, wake = WAKE): Promise<Response> {
  if (!env.BACKEND_URL) return json(503, 'BACKEND_NOT_CONFIGURED', 'Falta BACKEND_URL en Cloudflare Pages');
  const incoming = new URL(request.url);
  const target = new URL(`${incoming.pathname}${incoming.search}`, env.BACKEND_URL);
  const init: RequestInit = { method: request.method, headers: forwardedHeaders(request, env), redirect: 'manual' };
  if (request.method !== 'GET' && request.method !== 'HEAD') init.body = await request.arrayBuffer();
  const response = await fetchAwake(target, init, wake);
  if (response) return new Response(response.body, response);
  return json(502, 'BACKEND_UNAVAILABLE', 'El servidor está despertando; intenta de nuevo en un minuto');
}
