import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { CATEGORIES } from '../lib/categoryConfig';
import { mockApi } from '../test/mockApi';
import { useTintalData } from './useTintalData';

const DENSE = ['datos-catastrales', 'estado-calles'];
const one = { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: null, properties: { id: 1 } }] };
let fetchMock: ReturnType<typeof mockApi>;
const asked = () => fetchMock.mock.calls.map(([input]) => new URL(String(input), 'http://localhost').pathname.split('/')[3] ?? '');
const ready = (result: { current: ReturnType<typeof useTintalData> }) => {
  if (result.current.status !== 'ready') throw new Error('cargando');
  return result.current.data.categories;
};

beforeEach(() => {
  fetchMock = mockApi(Object.fromEntries(CATEGORIES.map(({ slug }) => [`/${slug}/geojson`, { body: one }])));
});

// Rendimiento (D121): el módulo de lotes pesa ~4 MB sin comprimir (511 KB con brotli) y tarda ~3,5 s
// en el servidor. Solo se dibuja con los 14 módulos (Inicio y Mapa 3D); dentro de otro módulo, no.
describe('useTintalData: los módulos densos solo cuando se muestran los 14', () => {
  it('dentro de un módulo no pide lotes ni tramos de calle, y la lista sigue teniendo los 14', async () => {
    const { result } = renderHook(() => useTintalData(false));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(asked()).toHaveLength(12);
    expect(asked().filter((slug) => DENSE.includes(slug))).toEqual([]);
    const categories = ready(result);
    expect(categories.map((c) => c.slug)).toEqual(CATEGORIES.map((c) => c.slug));
    expect(categories.filter((c) => DENSE.includes(c.slug)).map((c) => c.collection)).toEqual([null, null]);
  });

  it('con los 14 a la vista (Inicio o Mapa 3D) los pide todos en la misma tanda', async () => {
    const { result } = renderHook(() => useTintalData(true));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(asked()).toHaveLength(14);
    expect(ready(result).every((c) => c.collection !== null)).toBe(true);
  });

  it('al pasar de un módulo a Mapa 3D pide solo los dos densos y los suma', async () => {
    const { result, rerender } = renderHook(({ all }) => useTintalData(all), { initialProps: { all: false } });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    rerender({ all: true });
    await waitFor(() => expect(ready(result).every((c) => c.collection !== null)).toBe(true));
    expect(asked()).toHaveLength(14);
    expect(asked().slice(12).sort()).toEqual(DENSE);
  });
});
