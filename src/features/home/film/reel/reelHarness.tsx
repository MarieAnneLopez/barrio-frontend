// Montaje del reel para las pruebas que necesitan su rama WebGL. Quien lo use debe sustituir antes
// el renderer de three por el de mentira (ver fakeThree en glKit.ts).
import { act, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { vi } from 'vitest';
import { useA11yStore } from '../../../../store/a11yStore';
import { fakeCanvas2d, fakeWebGL } from './glKit';
import { ModuleReel } from './ModuleReel';
import { fakeFrames, fakeObservers } from './testKit';

interface MountOptions {
  reducedMotion?: boolean;
  strict?: boolean;
  /** El capítulo queda lejos de la pantalla: el motor todavía no se pide. */
  far?: boolean;
  /** Antes de montar: para dejar preparado lo que el reel lee al nacer. */
  before?: () => void;
}

/** Monta el capítulo como en un navegador con WebGL y, salvo `far`, lo deja ya en pantalla y dibujando. */
export async function mountReel({ reducedMotion = false, strict = false, far = false, before }: MountOptions = {}) {
  fakeWebGL();
  const painted = fakeCanvas2d();
  const frames = fakeFrames();
  const observers = fakeObservers();
  useA11yStore.setState({ reducedMotion });
  before?.();
  const router = createMemoryRouter([
    { path: '/', element: <main><ModuleReel /></main> },
    { path: '/categorias/:slug', element: <p>módulo abierto</p> },
  ]);
  const tree = <RouterProvider router={router} />;
  const view = render(strict ? <StrictMode>{tree}</StrictMode> : tree);
  /** Espera a que termine la descarga del motor (import dinámico) y a la tipografía de las portadas. */
  const settle = () => act(async () => {
    await vi.dynamicImportSettled();
    await Promise.resolve();
  });
  /** El capítulo se acerca a la pantalla: se pide el motor y, cuando llega, empieza a dibujar. */
  const arrive = async () => {
    act(() => observers.show(true));
    await settle();
    act(() => observers.show(true)); // el motor ya observa por su cuenta si se le ve
  };
  if (!far) await arrive();
  return {
    ...view,
    router,
    frames,
    observers,
    painted,
    settle,
    arrive,
    section: () => view.container.querySelector('section') as HTMLElement,
    /** El contenedor enfocable del lienzo. */
    reel: () => screen.getByRole('group', { name: 'Los 14 módulos del barrio' }),
    /** Deja pasar cuadros (1 s por defecto), con las actualizaciones de React dentro de act. */
    advance: (count = 60) => act(() => frames.run(count)),
  };
}

export type MountedReel = Awaited<ReturnType<typeof mountReel>>;
