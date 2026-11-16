import { useTranslation } from 'react-i18next';

/**
 * Logo del encabezado (D82, pedido de Marie): el rostro sonriente de Mini Marie, recortado del
 * cuadro 6 del saludo que ella dibujó (mismo estilo y expresión), sobre un círculo lavanda.
 * 32 px en móvil y 48 px desde sm; el favicon usa el mismo dibujo.
 */
export function BrandLogo() {
  const { t } = useTranslation();
  return (
    <span
      role="img"
      aria-label={t('app.title')}
      className="brand-logo inline-flex size-8 shrink-0 overflow-hidden rounded-full border-2 border-ink bg-pink sm:size-12"
    >
      <img
        src="/assets/brand/marie-logo-96.png"
        srcSet="/assets/brand/marie-logo-64.png 64w, /assets/brand/marie-logo-96.png 96w"
        sizes="(min-width: 640px) 48px, 32px"
        alt=""
        width={48}
        height={48}
        draggable={false}
        className="size-full object-cover"
      />
    </span>
  );
}
