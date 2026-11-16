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
 * Render gratuito se apaga tras 15 min sin uso y tarda ~40 s en volver (D64, D82): mientras
 * arranca, la conexión falla o responde 502/503/504. El proxy espera y reintenta hasta que
 * despierta (sin límite de duración en Workers HTTP; ~20 subpeticiones de 50 posibles).
 */
export const WAKE = { totalMs: 50_000, stepMs: 2_500 };
const ASLEEP = new Set([502, 503, 504]);
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  const headers = new Headers(request.headers);
  // Nadie de afuera puede hacerse pasar por el proxy: estas cabeceras solo las pone él.
  ['host', 'x-proxy-secret', 'x-client-ip'].forEach((name) => headers.delete(name));
  if (env.PROXY_SECRET) {
    headers.set('x-proxy-secret', env.PROXY_SECRET);
    headers.set('x-client-ip', request.headers.get('cf-connecting-ip') ?? '');
  }
  const init: RequestInit = { method: request.method, headers, redirect: 'manual' };
  if (request.method !== 'GET' && request.method !== 'HEAD') init.body = await request.arrayBuffer();
  const response = await fetchAwake(target, init, wake);
  if (response) return new Response(response.body, response);
  return json(502, 'BACKEND_UNAVAILABLE', 'El servidor está despertando; intenta de nuevo en un minuto');
}
