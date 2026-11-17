import { afterEach, describe, expect, it, vi } from 'vitest';
import { proxyToBackend } from './pagesProxy';

afterEach(() => vi.unstubAllGlobals());

describe('Proxy de Cloudflare Pages (D62)', () => {
  it('reenvía ruta, método, cuerpo y cookie; pone la IP real con la clave y quita las falsificadas', async () => {
    const backend = vi.fn<(url: URL, init?: RequestInit) => Promise<Response>>(async () =>
      new Response('{"ok":true}', { status: 201, headers: { 'Set-Cookie': 'mm_session=x; Path=/api; HttpOnly' } }));
    vi.stubGlobal('fetch', backend);
    const request = new Request('https://tintal.pages.dev/api/v1/auth/login?x=1', {
      method: 'POST', body: '{"email":"a@b.co"}',
      headers: { cookie: 'mm_session=y', 'cf-connecting-ip': '190.1.2.3', 'x-client-ip': '6.6.6.6', 'x-proxy-secret': 'falsa' },
    });

    const response = await proxyToBackend(request, { BACKEND_URL: 'https://api.onrender.com', PROXY_SECRET: 'clave' });

    const [url, init] = backend.mock.calls[0] as [URL, RequestInit];
    expect(String(url)).toBe('https://api.onrender.com/api/v1/auth/login?x=1');
    expect(init.method).toBe('POST');
    expect(new TextDecoder().decode(init.body as ArrayBuffer)).toBe('{"email":"a@b.co"}');
    const headers = init.headers as Headers;
    expect([headers.get('x-client-ip'), headers.get('x-proxy-secret'), headers.get('cookie')])
      .toEqual(['190.1.2.3', 'clave', 'mm_session=y']);
    expect(response.status).toBe(201);
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
  });

  it('no reenvía las cabeceras que Cloudflare añadió por el camino (cf-, x-forwarded-, cdn-loop…), sí las de la app', async () => {
    const backend = vi.fn<(url: URL, init?: RequestInit) => Promise<Response>>(async () => new Response('[]'));
    vi.stubGlobal('fetch', backend);
    const edge = { 'cf-ray': '8a1', 'cf-ipcountry': 'CO', 'cf-visitor': '{}', 'cf-connecting-ip': '190.1.2.3', 'cdn-loop': 'cloudflare',
      'x-forwarded-for': '190.1.2.3', 'x-forwarded-proto': 'https', 'x-real-ip': '190.1.2.3', connection: 'keep-alive' };
    const app = { cookie: 'mm_session=y', accept: 'application/json', 'accept-language': 'es', 'content-type': 'application/json', origin: 'https://t.dev' };
    await proxyToBackend(new Request('https://t.dev/api/v1/barberias', { headers: { ...edge, ...app } }),
      { BACKEND_URL: 'https://api.onrender.com', PROXY_SECRET: 'clave' });
    const headers = (backend.mock.calls[0] as [URL, RequestInit])[1].headers as Headers;
    for (const name of Object.keys(edge)) expect(headers.get(name), name).toBeNull();
    for (const [name, value] of Object.entries(app)) expect(headers.get(name), name).toBe(value);
    expect(headers.get('x-client-ip')).toBe('190.1.2.3'); // la IP real viaja solo por la cabecera del proxy
  });

  it('sin clave no reenvía cabeceras de IP; sin backend o caído responde con el formato de error', async () => {
    const backend = vi.fn(async () => new Response('[]'));
    vi.stubGlobal('fetch', backend);
    await proxyToBackend(new Request('https://t.dev/api/v1/barberias', { headers: { 'x-client-ip': '6.6.6.6' } }),
      { BACKEND_URL: 'https://api.onrender.com' });
    const headers = (backend.mock.calls[0] as unknown as [URL, RequestInit])[1].headers as Headers;
    expect(headers.get('x-client-ip')).toBeNull();

    const missing = await proxyToBackend(new Request('https://t.dev/api/v1/health'), {});
    expect(missing.status).toBe(503);
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('network'); }));
    const down = await proxyToBackend(new Request('https://t.dev/api/v1/health'), { BACKEND_URL: 'https://api.onrender.com' },
      { totalMs: 0, stepMs: 0 });
    expect(down.status).toBe(502);
    expect(await down.json()).toEqual({ error: { code: 'BACKEND_UNAVAILABLE', message: expect.stringContaining('despertando') } });
  });

  it('mientras Render despierta (conexión cortada o 502/503) espera y reintenta hasta que responde (D82)', async () => {
    const answers = [() => { throw new TypeError('network'); }, () => new Response('', { status: 502 }),
      () => new Response('', { status: 503 }), () => new Response('{"ok":true}', { status: 200 })];
    let n = 0;
    const backend = vi.fn(async () => answers[n++]?.() ?? new Response('', { status: 500 }));
    vi.stubGlobal('fetch', backend);
    const response = await proxyToBackend(new Request('https://t.dev/api/v1/chat', { method: 'POST', body: '{"m":1}' }),
      { BACKEND_URL: 'https://api.onrender.com' }, { totalMs: 5_000, stepMs: 1 });
    expect(backend).toHaveBeenCalledTimes(4);
    expect(response.status).toBe(200);
  });
});
