// Proxy de Cloudflare Pages hacia la API en Render (D62). Lo usa functions/api/[[path]].ts.
// El navegador solo habla con el dominio de Pages: la cookie de sesión (SameSite=Strict,
// Path=/api) sigue siendo de mismo origen y no hace falta CORS con credenciales.

export interface ProxyEnv {
  /** URL pública del backend en Render, sin barra final (p. ej. https://barrio-backend.onrender.com). */
  BACKEND_URL?: string;
  /** Misma clave que PROXY_SECRET en Render: con ella el backend cree la IP reenviada. */
  PROXY_SECRET?: string;
}

const json = (status: number, code: string, message: string) =>
  new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export async function proxyToBackend(request: Request, env: ProxyEnv): Promise<Response> {
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
  try {
    const response = await fetch(target, init);
    return new Response(response.body, response);
  } catch {
    return json(502, 'BACKEND_UNAVAILABLE', 'El servidor está despertando; intenta de nuevo en un minuto');
  }
}
