import { useEffect, useState } from 'react';
import { RETRY_3D_MS } from './data/useTintal3D';

/** El código de la maqueta (three + r3f + sus capas) va en un trozo aparte: el resto del sitio no paga su peso. */
export type SceneModule = typeof import('./TintalScene');
export type SceneLoader = () => Promise<SceneModule>;

let loaded: SceneModule | null = null;
let pending: Promise<SceneModule> | null = null;

const loadScene: SceneLoader = () => {
  pending ??= import('./TintalScene').then(
    (module) => (loaded = module),
    (error: unknown) => {
      pending = null; // la próxima vez se vuelve a pedir
      throw error;
    },
  );
  return pending;
};

/**
 * El módulo de la escena, o null mientras llega. Sin Suspense a propósito (D112): la maqueta tiene su
 * propio esqueleto, así que su código no saca la pantalla de carga completa a mitad de página (en el
 * Inicio llega al acercarse al capítulo 3, con el scroll). Si falla la red, reintenta sola.
 */
export function useSceneModule(load: SceneLoader = loadScene, delays: readonly number[] = RETRY_3D_MS): SceneModule | null {
  const [state, setState] = useState({ module: loaded, tries: 0 });
  useEffect(() => {
    if (state.module) return undefined;
    let live = true;
    let timer = 0;
    load().then(
      (module) => live && setState({ module, tries: state.tries }),
      () => {
        const wait = delays[state.tries];
        if (!live || wait === undefined) return;
        timer = window.setTimeout(() => setState((s) => ({ ...s, tries: s.tries + 1 })), wait);
      },
    );
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [state, load, delays]);
  return state.module;
}
