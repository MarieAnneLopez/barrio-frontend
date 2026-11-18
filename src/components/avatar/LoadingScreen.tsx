import './loading-screen.css';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoadingScreen } from '../../hooks/useLoadingScreen';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useLoadingScreenStore } from '../../store/loadingScreenStore';
import { BarRunner } from './loading/BarRunner';
import { LoadingProgress } from './loading/LoadingProgress';
import { LoadingScene } from './loading/LoadingScene';
import { LOADER_WIDE, runKeyframes, runPath } from './loadingRun';
import { cellWidth } from './sequences';
import { SequenceSprite } from './SequenceSprite';

/**
 * Pantalla de carga completa (H33; gran actualización): Mini Marie cruza la pantalla hacia la
 * derecha con su ciclo de 32 cuadros (sprites32), avanzando por cuadro lo que retrocede su pie
 * apoyado (loadingRun.ts): una posición entera por cuadro, con la API de animaciones, sobre un
 * barrio en capas con parallax lento (LoadingScene) y un suelo quieto. Debajo, la barra con el
 * progreso real (LoadingProgress) y una Mini Marie pequeña que corre con su punta. Al menos 700 ms.
 * Escala entera (D86): 420 px de alto si cabe sin que su cabeza llegue al sol; si no, la mitad.
 * Movimiento reducido: pose fija al centro mirando a la derecha, barrio quieto y barra sin adornos.
 */
export function LoadingScreen() {
  const { t } = useTranslation();
  const { visible, leaving, busy } = useLoadingScreen();
  const setVisible = useLoadingScreenStore((s) => s.setVisible);
  const size = useMediaQuery(LOADER_WIDE, true) ? 420 : 210;
  const reduced = useReducedMotion();
  const track = useRef<HTMLDivElement>(null);
  // Las dos Mini Marie comparten un solo atlas a 1× (D111): a 2× y 3× el navegador lo amplía entero y
  // nítido (pixelated); bajar además el doble costaba ~400 KB en el celular antes de ver la página.
  const rider = useCallback((shown: number) => <BarRunner shown={shown} atlas={size} />, [size]);

  useEffect(() => setVisible(visible), [visible, setVisible]);

  // Antes de pintar, para que arranque a la vez que los cuadros (sus animaciones CSS).
  useLayoutEffect(() => {
    const node = track.current;
    if (!visible || reduced || !node || typeof node.animate !== 'function') return undefined;
    const path = runPath(window.innerWidth, size, cellWidth('run', size));
    const run = node.animate(runKeyframes(path, size), { duration: path.durationMs, iterations: Infinity });
    return () => run.cancel();
  }, [visible, reduced, size]);

  if (!visible) return null;
  return (
    <div role="status" aria-live="polite" data-leaving={leaving || undefined} className="loading-screen fixed inset-0 z-[140]">
      <div className="loading-screen__stage">
        <LoadingScene />
        <div ref={track} className="loading-screen__track">
          <SequenceSprite name="run" size={size} atlas={size} pose={3} className="loading-screen__runner" />
        </div>
      </div>
      <div className="loading-screen__ground" aria-hidden="true" />
      <div className="loading-screen__floor">
        <LoadingProgress busy={busy && !leaving} reduced={reduced} rider={rider} />
        <p className="loading-screen__text">
          <span className="sr-only">{t('loading.runner')}. </span>
          {t('loading.screen')}
        </p>
      </div>
    </div>
  );
}
