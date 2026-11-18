import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeObservers } from './ribbonGlKit';
import { watchRibbon } from './ribbonWatch';

afterEach(() => vi.restoreAllMocks());

/** matchMedia de mentira: apunta cada consulta con su lista, que la prueba dispara a mano. */
function fakeMedia() {
  const queries: { media: string; list: EventTarget }[] = [];
  vi.stubGlobal('matchMedia', (media: string) => {
    const list = Object.assign(new EventTarget(), { media, matches: true });
    queries.push({ media, list });
    return list;
  });
  return queries;
}

describe('lo que vigila la cinta', () => {
  it('otro pixel ratio sin otro tamaño (al pasar a otra pantalla) también redimensiona el lienzo', () => {
    fakeObservers();
    const queries = fakeMedia();
    vi.stubGlobal('devicePixelRatio', 1);
    const onResize = vi.fn();
    const stop = watchRibbon({ frame: document.createElement('div'), onResize, onVisible: vi.fn(), onTheme: vi.fn() });
    expect(queries.map(({ media }) => media)).toEqual(['(resolution: 1dppx)']);
    vi.stubGlobal('devicePixelRatio', 2);
    queries[0]?.list.dispatchEvent(new Event('change'));
    expect(onResize).toHaveBeenCalledTimes(1);
    expect(queries.map(({ media }) => media)).toEqual(['(resolution: 1dppx)', '(resolution: 2dppx)']);
    queries[0]?.list.dispatchEvent(new Event('change')); // la consulta vieja ya no se escucha
    expect(onResize).toHaveBeenCalledTimes(1);
    const current = queries[1]?.list as EventTarget;
    const removed = vi.spyOn(current, 'removeEventListener');
    stop();
    expect(removed).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('sin matchMedia (navegadores viejos, jsdom) vigila lo demás sin romperse', () => {
    fakeObservers();
    vi.stubGlobal('matchMedia', undefined);
    const stop = watchRibbon({ frame: document.createElement('div'), onResize: vi.fn(), onVisible: vi.fn(), onTheme: vi.fn() });
    expect(stop).not.toThrow();
  });
});
