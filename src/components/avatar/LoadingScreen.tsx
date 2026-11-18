import './loading-screen.css';
import { useEffect, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoadingScreen } from '../../hooks/useLoadingScreen';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useLoadingScreenStore } from '../../store/loadingScreenStore';
import { LoadingProgress } from './loading/LoadingProgress';
import { LoadingScene } from './loading/LoadingScene';
import { runPath } from './loadingRun';
import { cellWidth } from './sequences';
import { SequenceSprite } from './SequenceSprite';

/**
 * Pantalla de carga completa (H33; gran actualización): Mini Marie cruza la pantalla hacia la
 * derecha, avanzando por cuadro lo que retrocede su pie apoyado (loadingRun.ts), sobre un barrio en
 * capas con parallax lento (LoadingScene) y un suelo quieto; debajo, la barra con el progreso real
 * (LoadingProgress). Al menos 700 ms. Escala entera (D86): 420 px de alto si la pantalla da para
 * ello sin que su cabeza llegue al sol; si no, la mitad exacta. Movimiento reducido: pose fija al
 * centro mirando a la derecha, barrio quieto y barra sin adornos.
 */
export function LoadingScreen() {
  const { t } = useTranslation();
  const { visible, leaving, busy } = useLoadingScreen();
  const setVisible = useLoadingScreenStore((s) => s.setVisible);
  const reduced = useReducedMotion();
  const size = useMediaQuery('(min-width: 640px) and (min-height: 860px)', true) ? 420 : 210;

  useEffect(() => setVisible(visible), [visible, setVisible]);

  if (!visible) return null;
  const path = runPath(window.innerWidth, size, cellWidth('run', size));
  const track = {
    '--run-start': `${path.start}px`,
    '--run-end': `${path.start + path.distance}px`,
    animationDuration: `${path.durationMs}ms`,
    animationTimingFunction: `steps(${path.steps})`,
  } as CSSProperties;
  return (
    <div role="status" aria-live="polite" data-leaving={leaving || undefined} className="loading-screen fixed inset-0 z-[140]">
      <div className="loading-screen__stage">
        <LoadingScene />
        <div className="loading-screen__track" style={track}>
          <SequenceSprite name="run" size={size} pose={3} className="loading-screen__runner" />
        </div>
      </div>
      <div className="loading-screen__ground" aria-hidden="true" />
      <div className="loading-screen__floor">
        <LoadingProgress busy={busy && !leaving} reduced={reduced} />
        <p className="loading-screen__text">
          <span className="sr-only">{t('loading.runner')}. </span>
          {t('loading.screen')}
        </p>
      </div>
    </div>
  );
}
