import './loading-screen.css';
import { useCallback, useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useDensity } from '../../hooks/useDensity';
import { useLoadingScreen } from '../../hooks/useLoadingScreen';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useViewportWidth } from '../../hooks/useViewportWidth';
import { useLoadingScreenStore } from '../../store/loadingScreenStore';
import { BarRunner, type BarRunnerHandle } from './loading/BarRunner';
import { LoadingProgress } from './loading/LoadingProgress';
import { LoadingScene } from './loading/LoadingScene';
import { frameAt, LOADER_WIDE, loaderAtlas, positionAt, runKeyframes, runPath } from './loadingRun';
import { cellWidth, FRAME_MS } from './sequences';
import { SequenceSprite } from './SequenceSprite';

/**
 * Pantalla de carga completa (H33; gran actualización): Mini Marie cruza la pantalla hacia la
 * derecha con su ciclo de 32 cuadros (sprites32), avanzando por cuadro lo que retrocede su pie
 * apoyado (loadingRun.ts): una posición entera por cuadro, con la API de animaciones, sobre un
 * barrio en capas con parallax lento (LoadingScene) y un suelo quieto. Debajo, la barra con el
 * progreso real (LoadingProgress) y una Mini Marie pequeña que corre con su punta. Al menos 700 ms.
 * Escala entera (D86): 420 px de alto si la pantalla da para ello (LOADER_WIDE); si no, la mitad.
 * Movimiento reducido: pose fija al centro mirando a la derecha, barrio quieto y barra sin adornos.
 */
export function LoadingScreen() {
  const { t } = useTranslation();
  const { visible, leaving, busy } = useLoadingScreen();
  const setVisible = useLoadingScreenStore((s) => s.setVisible);
  const size = useMediaQuery(LOADER_WIDE, true) ? 420 : 210;
  // Las dos Mini Marie comparten un solo atlas, elegido por la densidad real (D111; auditoría MM-01):
  // el de 210 solo a 1× donde la grande mide 210; el de 420 en todo lo demás. Una sola descarga, la
  // que precarga index.html. La de la barra (105 px) siempre lo reduce, con suavizado (bar-runner.css).
  const atlas = loaderAtlas(size, useDensity());
  const reduced = useReducedMotion();
  const width = useViewportWidth();
  const track = useRef<HTMLDivElement>(null);
  const resume = useRef<number | null>(null); // dónde iba (px) al rehacer el recorrido
  const runner = useRef<BarRunnerHandle>(null);
  // La barra le da a la de la punta su posición real en cada rAF (auditoría MM-09).
  const travel = useCallback((px: number) => runner.current?.travel(px), []);

  useEffect(() => setVisible(visible), [visible, setVisible]);

  // Antes de pintar, para que arranque a la vez que los cuadros (sus animaciones CSS). Si cambia el
  // ancho (girar el celular, redimensionar) o su tamaño, el recorrido se rehace desde donde iba
  // (auditoría MM-10); al volver a aparecer, entra otra vez por la izquierda.
  useLayoutEffect(() => {
    const node = track.current;
    if (!visible || reduced || !node || typeof node.animate !== 'function') {
      resume.current = null;
      return undefined;
    }
    const path = runPath(width, size, cellWidth('run', size));
    const run = node.animate(runKeyframes(path, size), { duration: path.durationMs, iterations: Infinity });
    if (resume.current !== null) run.currentTime = (frameAt(path, size, resume.current) + 0.01) * FRAME_MS.run;
    return () => {
      resume.current = positionAt(path, size, Number(run.currentTime ?? 0));
      run.cancel();
    };
  }, [visible, reduced, size, width]);

  if (!visible) return null;
  return (
    <div role="status" aria-live="polite" data-leaving={leaving || undefined} className="loading-screen fixed inset-0 z-[140]">
      {/* Su alto, para que el sol quede siempre por encima de su cabeza (loading-scene.css). */}
      <div className="loading-screen__stage" style={{ '--runner': `${size}px` } as CSSProperties}>
        <LoadingScene />
        <div ref={track} className="loading-screen__track">
          <SequenceSprite name="run" size={size} atlas={atlas} pose={3} className="loading-screen__runner" />
        </div>
      </div>
      <div className="loading-screen__ground" aria-hidden="true" />
      <div className="loading-screen__floor">
        <LoadingProgress busy={busy && !leaving} reduced={reduced} rider={<BarRunner ref={runner} atlas={atlas} />} onTravel={travel} />
        <p className="loading-screen__text">
          <span className="sr-only">{t('loading.runner')}. </span>
          {t('loading.screen')}
        </p>
      </div>
    </div>
  );
}
