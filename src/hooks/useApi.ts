import { useEffect, useState } from 'react';
import { ApiError, apiGet, type QueryParams } from '../lib/apiClient';

export type ApiState<T> =
  | { status: 'loading'; data: undefined; error: undefined }
  | { status: 'success'; data: T; error: undefined }
  | { status: 'error'; data: undefined; error: ApiError };

const LOADING = { status: 'loading', data: undefined, error: undefined } as const;

/**
 * GET declarativo: se repite cuando cambian path o params y cancela la
 * petición anterior (sin respuestas fuera de orden). `retry` vuelve a pedir.
 */
export function useApi<T>(path: string | null, params?: QueryParams) {
  const key = JSON.stringify([path, params]);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ key: string; value: ApiState<T> }>({ key: '', value: LOADING });

  useEffect(() => {
    // path y params se leen de `key` para que el efecto dependa solo de valores estables.
    const [currentPath, currentParams] = JSON.parse(key) as [string | null, QueryParams | undefined];
    if (currentPath === null) return undefined;
    const controller = new AbortController();
    apiGet<T>(currentPath, currentParams, controller.signal).then(
      (data) => setState({ key, value: { status: 'success', data, error: undefined } }),
      (error: unknown) => {
        if (controller.signal.aborted) return;
        const apiError = error instanceof ApiError ? error : new ApiError(0, 'UNKNOWN', String(error));
        setState({ key, value: { status: 'error', data: undefined, error: apiError } });
      },
    );
    return () => controller.abort();
  }, [key, attempt]);

  const current: ApiState<T> = state.key === key ? state.value : LOADING;
  return { ...current, retry: () => setAttempt((n) => n + 1) };
}
