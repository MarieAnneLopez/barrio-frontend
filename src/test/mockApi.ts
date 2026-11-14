import { vi } from 'vitest';

export interface MockResponse {
  status?: number;
  body: unknown;
}

type Route = MockResponse | ((url: URL, init?: RequestInit) => MockResponse | Promise<MockResponse>);

/**
 * Sustituye fetch: cada ruta (pathname sin /api/v1) devuelve una respuesta fija
 * o calculada; lo no declarado responde 404 con el formato de error del backend.
 */
export function mockApi(routes: Record<string, Route>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost');
    const route = routes[url.pathname.replace(/^\/api\/v1/, '')];
    // Una ruta puede responder tarde (promesa) para probar estados de espera.
    const result: MockResponse = typeof route === 'function'
      ? await route(url, init)
      : route ?? { status: 404, body: { error: { code: 'NOT_FOUND', message: 'Not Found' } } };
    return new Response(JSON.stringify(result.body), {
      status: result.status ?? 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** Parámetros de las llamadas a una ruta, para comprobar búsqueda y paginación. */
export function callsTo(fetchMock: ReturnType<typeof mockApi>, path: string): URLSearchParams[] {
  return fetchMock.mock.calls
    .map(([input]) => new URL(String(input), 'http://localhost'))
    .filter((url) => url.pathname === `/api/v1${path}`)
    .map((url) => url.searchParams);
}
