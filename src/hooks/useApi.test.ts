import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { callsTo, mockApi } from '../test/mockApi';
import { useApi } from './useApi';

describe('useApi', () => {
  it('pide sin parámetros (regresión: JSON los volvía null y buildUrl fallaba)', async () => {
    const fetchMock = mockApi({ '/barberias/3': { body: { id: 3 } } });

    const { result } = renderHook(() => useApi<{ id: number }>('/barberias/3'));

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.data).toEqual({ id: 3 });
    expect(callsTo(fetchMock, '/barberias/3')).toHaveLength(1);
  });

  it('con path null no pide nada y se queda cargando', () => {
    const fetchMock = mockApi({});

    const { result } = renderHook(() => useApi(null));

    expect(result.current.status).toBe('loading');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
