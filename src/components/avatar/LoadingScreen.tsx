import './loading-screen.css';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLoadingScreen } from '../../hooks/useLoadingScreen';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useLoadingScreenStore } from '../../store/loadingScreenStore';
import { SequenceSprite } from './SequenceSprite';

/**
 * Pantalla de carga completa (H33): Mini Marie corre en su sitio con los 8 cuadros
 * que dibujó Marie mientras el suelo pasa por debajo. Al menos 700 ms; con
 * movimiento reducido, pose fija y solo el fundido de salida. Escala entera (D86):
 * 420 px de alto si la pantalla da para ello; si no, la mitad exacta.
 */
export function LoadingScreen() {
  const { t } = useTranslation();
  const { visible, leaving } = useLoadingScreen();
  const setVisible = useLoadingScreenStore((s) => s.setVisible);
  const size = useMediaQuery('(min-width: 640px) and (min-height: 700px)', true) ? 420 : 210;

  useEffect(() => setVisible(visible), [visible, setVisible]);

  if (!visible) return null;
  return (
    <div role="status" aria-live="polite" data-leaving={leaving || undefined} className="loading-screen fixed inset-0 z-[140]">
      <div className="loading-screen__stage">
        <SequenceSprite name="run" size={size} pose={3} className="loading-screen__runner" />
        <div className="loading-screen__ground" aria-hidden="true" />
      </div>
      <p className="loading-screen__text">
        <span className="sr-only">{t('loading.runner')}. </span>
        {t('loading.screen')}
      </p>
    </div>
  );
}
