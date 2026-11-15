import './loading-bar.css';
import { useTranslation } from 'react-i18next';
import { useLoadingProgress } from '../../hooks/useLoadingProgress';
import { SequenceSprite } from './SequenceSprite';

/**
 * Barra de carga superior (§11.3.5, H24): pista vino, relleno rosa ligado al
 * avance real de las peticiones y cargas diferidas, y Mini Marie corriendo
 * (sus 8 cuadros, H33) sobre el borde del relleno. No captura clics: nunca bloquea la interfaz.
 * Relleno y corredora se mueven con transform (scaleX / translateX).
 */
export function LoadingRunnerBar() {
  const { t } = useTranslation();
  const { visible, finishing, progress } = useLoadingProgress();
  if (!visible) return null;
  const percent = Math.round(progress * 100);

  return (
    <div
      role="progressbar"
      aria-label={t('loading.label')}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      data-finishing={finishing || undefined}
      className="loading-bar pointer-events-none fixed inset-x-0 top-0 z-[90]"
    >
      <div className="loading-bar__runner" style={{ transform: `translateX(${percent}%)` }}>
        <SequenceSprite name="run" height={28} pose={3} className="loading-bar__sprite" />
      </div>
      <div className="loading-bar__track">
        <div className="loading-bar__fill" style={{ transform: `scaleX(${progress})` }} />
      </div>
    </div>
  );
}
