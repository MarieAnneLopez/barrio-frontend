import './loading-screen.css';
import { useEffect, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoadingScreen } from '../../hooks/useLoadingScreen';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useLoadingScreenStore } from '../../store/loadingScreenStore';
import { runPath } from './loadingRun';
import { cellWidth } from './sequences';
import { SequenceSprite } from './SequenceSprite';

/**
 * Pantalla de carga completa (H33): Mini Marie cruza la pantalla hacia la derecha con los 8
 * cuadros que dibujó Marie, avanzando por cuadro lo que retrocede su pie apoyado (loadingRun.ts),
 * sobre una línea quieta. Al menos 700 ms; con movimiento reducido, pose fija al centro y solo el
 * fundido de salida. Escala entera (D86): 420 px de alto si la pantalla da para ello; si no, la
 * mitad exacta.
 */
export function LoadingScreen() {
  const { t } = useTranslation();
  const { visible, leaving } = useLoadingScreen();
  const setVisible = useLoadingScreenStore((s) => s.setVisible);
  const size = useMediaQuery('(min-width: 640px) and (min-height: 700px)', true) ? 420 : 210;

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
        <div className="loading-screen__track" style={track}>
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
