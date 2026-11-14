import { describe, expect, it, vi } from 'vitest';
import { mockApi } from '../test/mockApi';
import { ApiError, apiGet, buildUrl } from './apiClient';

describe('apiClient', () => {
  it('construye la URL omitiendo parámetros vacíos', () => {
    expect(buildUrl('/centros-educativos', { page: 2, q: '', sort: undefined, size: 10 })).toBe(
      '/api/v1/centros-educativos?page=2&size=10',
    );
  });

  it('convierte el formato de error del backend en ApiError', async () => {
    mockApi({ '/x': { status: 422, body: { error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos' } } } });

    const error = await apiGet('/x').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 422, code: 'VALIDATION_ERROR', message: 'Datos inválidos' });
  });

  it('informa caída de red como NETWORK_ERROR', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(apiGet('/x')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });

  it('devuelve el JSON en respuestas correctas', async () => {
    mockApi({ '/health': { body: { status: 'ok' } } });

    await expect(apiGet('/health')).resolves.toEqual({ status: 'ok' });
  });
});
