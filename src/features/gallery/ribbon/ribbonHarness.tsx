// Montaje de la cinta para las pruebas que necesitan su rama WebGL. Quien lo use debe sustituir antes
// el renderer de three por el de mentira (ver fakeThree en ribbonGlKit.ts).
import { act, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { vi } from 'vitest';
import { useA11yStore } from '../../../store/a11yStore';
import { PhotoRibbon } from './PhotoRibbon';
import { fakeCanvas2d } from './ribbonCanvasKit';
import { fakeFrames, fakeObservers, fakeWebGL } from './ribbonGlKit';
import type { RibbonPhoto } from './ribbonPhotos';

export const LABELS = ['Calle 6', 'Calle 8', 'Biblioteca El Tintal', 'Carrera 87A', 'Tintal Plaza', 'Calle 6D', 'Hacienda El Tintal'];

export const PHOTOS: RibbonPhoto[] = LABELS.map((label, at) => {
  const src = `/assets/photos/mapillary/${at + 1}-1024.webp`;
  const photo = { id: at + 1, url: src, alt_text: `Vista ${at + 1} de ${label}.`, orden: at, autor: `Autor${at + 1}`, licencia: 'CC BY-SA 4.0', source_ref: `https://www.mapillary.com/app/?pKey=${at + 1}` };
  return { key: `foto-${at + 1}`, label, alt: photo.alt_text, src, thumb: { src }, photo };
});

interface MountOptions {
  photos?: RibbonPhoto[];
  reducedMotion?: boolean;
  strict?: boolean;
  /** La cinta queda lejos de la pantalla: el motor todavía no se pide. */
  far?: boolean;
  before?: () => void;
}

/** Monta la cinta como en un navegador con WebGL y, salvo `far`, la deja en pantalla y dibujando. */
export async function mountRibbon({ photos = PHOTOS, reducedMotion = false, strict = false, far = false, before }: MountOptions = {}) {
  fakeWebGL();
  const painted = fakeCanvas2d();
  const frames = fakeFrames();
  const observers = fakeObservers();
  useA11yStore.setState({ reducedMotion });
  before?.();
  const router = createMemoryRouter([
    { path: '/', element: <main><PhotoRibbon photos={photos} /></main> },
    { path: '/creditos-fotos', element: <p>créditos</p> },
  ]);
  const tree = <RouterProvider router={router} />;
  const view = render(strict ? <StrictMode>{tree}</StrictMode> : tree);
  /** Espera la descarga del motor (import dinámico) y la tipografía. */
  const settle = () => act(async () => {
    await vi.dynamicImportSettled();
    await Promise.resolve();
  });
  const arrive = async () => {
    act(() => observers.show(true));
    await settle();
    act(() => observers.show(true)); // el motor ya observa por su cuenta si se le ve
  };
  if (!far) await arrive();
  const root = () => view.container.querySelector('.ribbon') as HTMLElement;
  return {
    ...view,
    router,
    frames,
    observers,
    painted,
    settle,
    arrive,
    root,
    group: () => screen.getByRole('group', { name: 'Fotos de la galería' }),
    hit: (index: number) => root().querySelector(`[data-ribbon-index="${index}"]`) as HTMLButtonElement,
    live: () => root().querySelector('[aria-live]') as HTMLElement,
    /** Deja pasar cuadros (1 s por defecto), con las actualizaciones de React dentro de act. */
    advance: (count = 60) => act(() => void frames.run(count)),
  };
}

export type MountedRibbon = Awaited<ReturnType<typeof mountRibbon>>;
