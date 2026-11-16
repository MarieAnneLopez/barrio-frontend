import './loading-screen.css';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoadingScreen } from '../../hooks/useLoadingScreen';
import { useLoadingScreenStore } from '../../store/loadingScreenStore';
import { SequenceSprite } from './SequenceSprite';

/**
 * Pantalla de carga completa (H33): Mini Marie corre en su sitio con los 8 cuadros
 * que dibujó Marie mientras el suelo pasa por debajo. Al menos 700 ms; con
 * movimiento reducido, pose fija y solo el fundido de salida.
 */
export function LoadingScreen() {
  const { t } = useTranslation();
  const { visible, leaving } = useLoadingScreen();
  const setVisible = useLoadingScreenStore((s) => s.setVisible);

  useEffect(() => setVisible(visible), [visible, setVisible]);

  if (!visible) return null;
  return (
    <div role="status" aria-live="polite" data-leaving={leaving || undefined} className="loading-screen brick-bond fixed inset-0 z-[140]">
      <div className="loading-screen__stage">
        <SequenceSprite name="run" size={420} pose={3} className="loading-screen__runner" />
        <div className="loading-screen__ground" aria-hidden="true" />
      </div>
      <p className="loading-screen__text px-corners">
        <span className="sr-only">{t('loading.runner')}. </span>
        {t('loading.screen')}
      </p>
    </div>
  );
}
