import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { denserThan } from '../../lib/density';
import { useLoadingScreenStore } from '../../store/loadingScreenStore';
import { useLoadingStore } from '../../store/loadingStore';
import { painted, type Screen } from '../../test/loaderScreens';
import { LoadingScreen } from './LoadingScreen';
import { LOADER_WIDE } from './loadingRun';

/** matchMedia de una pantalla: la condición de tamaño de la carga y los dos umbrales de densidad. */
function screenIs({ w, h, dppx }: Screen) {
  const answer = (query: string) =>
    query === LOADER_WIDE ? w >= 640 && h >= 860 : query === denserThan(2.01) ? dppx >= 2.01 : query === denserThan(1.01) && dppx >= 1.01;
  window.matchMedia = (query: string) =>
    ({
      matches: answer(query),
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  useLoadingStore.setState({ tasks: {} });
  useLoadingScreenStore.setState({ lazy: 0, visible: false });
});

afterEach(() => vi.useRealTimers());

// Auditoría MM-01: la grande usaba siempre el atlas de 1× y a 3 dppx el navegador lo ampliaba con
// suavizado (borroso); a 1,25–1,75 dppx lo estiraba, lo que D86 quiso evitar.
describe('pantalla de carga: un solo atlas, elegido por la densidad real', () => {
  it.each([
    [390, 844, 1], [390, 844, 1.75], [390, 844, 3], [1440, 800, 1], [1440, 800, 1.25], [1440, 900, 1], [1440, 900, 2], [844, 390, 3],
  ])('a %i × %i px y %f dppx la única Mini Marie pinta el archivo precargado, el que toca', (w, h, dppx) => {
    screenIs({ w, h, dppx });
    const { container } = render(<LoadingScreen />);
    const big = container.querySelector('.loading-screen__runner .sequence__strip');
    const small = container.querySelector('.bar-runner .sequence__strip');
    expect(big).toBeNull();
    expect(small).toHaveAttribute('src', painted());
    expect(container.querySelectorAll('source')).toHaveLength(0); // una sola descarga: ningún <source> elige otra
  });
});
