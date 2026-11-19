import './brand-logo.css';
import { useTranslation } from 'react-i18next';
import { useAfterLoad } from '../../hooks/useAfterLoad';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { LogoCycle } from './LogoCycle';
import { LogoSources } from './LogoSources';

const logo = (size: number) => `/assets/brand/marie-logo-${size}.png`;

/**
 * Logo del encabezado (D82, pedido de Marie; auditoría MM-04): el rostro sonriente de Mini Marie
 * respirando, con su ciclo de reposo de 32 cuadros (LogoCycle), sobre un círculo con una línea de
 * 1 px. Escala entera (D86): 32 px en móvil y 48 px desde 640 px, y en pantallas densas el múltiplo
 * exacto (64 o 96 px). La caja va en px y con la línea por fuera (box-content): así el dibujo mide
 * justo 32 o 48 px, también con otro tamaño de letra. Primero se pinta el póster (PNG, el cuadro 0
 * del ciclo); el atlas se pide tras el load, con el navegador libre. Movimiento reducido: el póster.
 */
export function BrandLogo() {
  const { t } = useTranslation();
  const later = useAfterLoad();
  const reduced = useReducedMotion();
  return (
    <span
      role="img"
      aria-label={t('app.title')}
      className="brand-logo box-content inline-flex size-[32px] shrink-0 overflow-hidden rounded-full border border-ink bg-pink min-[640px]:size-[48px]"
    >
      <picture>
        <LogoSources file={logo} />
        <img src={logo(32)} alt="" width={32} height={32} draggable={false} className="size-full" />
      </picture>
      {later && !reduced ? <LogoCycle /> : null}
    </span>
  );
}
