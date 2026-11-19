import './brand-logo.css';
import { useTranslation } from 'react-i18next';
import { denserThan } from '../../lib/density';

const WIDE = '(min-width: 640px)';
const logo = (size: number) => `/assets/brand/marie-logo-${size}.png`;

/**
 * Logo del encabezado (D82, pedido de Marie): el rostro sonriente de Mini Marie, recortado del
 * cuadro 6 del saludo que ella dibujó (mismo estilo y expresión), sobre un círculo papel con una
 * línea de 1 px. Escala entera (D86): 32 px en móvil y 48 px desde 640 px, y en pantallas densas
 * el múltiplo exacto (64 o 96 px). La caja va en px y con la línea por fuera (box-content): así el
 * dibujo mide justo 32 o 48 px, también con otro tamaño de letra. El favicon usa el mismo dibujo.
 */
export function BrandLogo() {
  const { t } = useTranslation();
  return (
    <span
      role="img"
      aria-label={t('app.title')}
      className="brand-logo box-content inline-flex size-[32px] shrink-0 overflow-hidden rounded-full border border-ink bg-pink min-[640px]:size-[48px]"
    >
      <picture>
        <source media={denserThan(1.01, WIDE)} srcSet={logo(96)} />
        <source media={WIDE} srcSet={logo(48)} />
        <source media={denserThan(2.01)} srcSet={logo(96)} />
        <source media={denserThan(1.01)} srcSet={logo(64)} />
        <img src={logo(32)} alt="" width={32} height={32} draggable={false} className="size-full" />
      </picture>
    </span>
  );
}
