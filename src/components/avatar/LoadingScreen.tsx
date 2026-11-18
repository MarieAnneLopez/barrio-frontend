import './loading-screen.css';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoadingScreen } from '../../hooks/useLoadingScreen';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useLoadingScreenStore } from '../../store/loadingScreenStore';
import { runKeyframes, runPath } from './loadingRun';
import { cellWidth } from './sequences';
import { SequenceSprite } from './SequenceSprite';

/**
 * Pantalla de carga completa (H33): Mini Marie cruza la pantalla hacia la derecha con su ciclo de
 * 32 cuadros (sprites32), avanzando por cuadro lo que retrocede su pie apoyado (loadingRun.ts):
 * una posición entera por cuadro, con la API de animaciones, sobre una línea quieta. Al menos
 * 700 ms; con movimiento reducido, pose fija al centro y solo el fundido de salida. Escala entera
 * (D86): 420 px de alto si la pantalla da para ello; si no, la mitad exacta.
 */
export function LoadingScreen() {
  const { t } = useTranslation();
  const { visible, leaving } = useLoadingScreen();
  const setVisible = useLoadingScreenStore((s) => s.setVisible);
  const size = useMediaQuery('(min-width: 640px) and (min-height: 700px)', true) ? 420 : 210;
  const reduced = useReducedMotion();
  const track = useRef<HTMLDivElement>(null);

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
        <div ref={track} className="loading-screen__track">
          <SequenceSprite name="run" size={size} pose={3} className="loading-screen__runner" />
        </div>
        <div className="loading-screen__ground" aria-hidden="true" />
      </div>
      <p className="loading-screen__text">
        <span className="sr-only">{t('loading.runner')}. </span>
        {t('loading.screen')}
      </p>
    </div>
  );
}
