import './loading-screen.css';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoadingScreen } from '../../hooks/useLoadingScreen';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useLoadingScreenStore } from '../../store/loadingScreenStore';
import { BarRunner, type BarRunnerHandle } from './loading/BarRunner';
import { LoadingProgress } from './loading/LoadingProgress';
import { LoadingScene } from './loading/LoadingScene';

/** La única Mini Marie de carga sigue la punta de la barra de progreso. */
export function LoadingScreen() {
  const { t } = useTranslation();
  const { visible, leaving, busy } = useLoadingScreen();
  const setVisible = useLoadingScreenStore((s) => s.setVisible);
  const reduced = useReducedMotion();
  const runner = useRef<BarRunnerHandle>(null);
  // La barra le da a la de la punta su posición real en cada rAF (auditoría MM-09).
  const travel = useCallback((px: number) => runner.current?.travel(px), []);

  useEffect(() => setVisible(visible), [visible, setVisible]);

  if (!visible) return null;
  return (
    <div role="status" aria-live="polite" data-leaving={leaving || undefined} className="loading-screen fixed inset-0 z-[140]">
      <div className="loading-screen__stage">
        <LoadingScene />
      </div>
      <div className="loading-screen__ground" aria-hidden="true" />
      <div className="loading-screen__floor">
        <LoadingProgress busy={busy && !leaving} reduced={reduced} rider={<BarRunner ref={runner} atlas={240} />} onTravel={travel} />
        <p className="loading-screen__text">
          <span className="sr-only">{t('loading.runner')}. </span>
          {t('loading.screen')}
        </p>
      </div>
    </div>
  );
}
