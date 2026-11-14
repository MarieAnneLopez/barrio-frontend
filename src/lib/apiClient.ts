// Cliente HTTP de la API (/api/v1). En desarrollo Vite redirige /api al backend.
const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1';
const TIMEOUT_MS = 15_000;

/** Error con el formato único del backend: {"error": {code, message, details}}. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export function buildUrl(path: string, params: QueryParams = {}): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  }
  const query = search.toString();
  return `${BASE_URL}${path}${query ? `?${query}` : ''}`;
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as { error?: { code?: string; message?: string } };
    return new ApiError(response.status, body.error?.code ?? 'HTTP_ERROR', body.error?.message ?? response.statusText);
  } catch {
    return new ApiError(response.status, 'HTTP_ERROR', response.statusText);
  }
}

/** GET con timeout; respeta la señal del llamador (cancelación al desmontar). */
export async function apiGet<T>(path: string, params?: QueryParams, signal?: AbortSignal): Promise<T> {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  let response: Response;
  try {
    response = await fetch(buildUrl(path, params), {
      headers: { Accept: 'application/json' },
      signal: combined,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el servidor');
  }
  if (!response.ok) throw await toApiError(response);
  return (await response.json()) as T;
}
