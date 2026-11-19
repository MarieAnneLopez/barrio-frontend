import type { Geometry } from 'geojson';
import { useTranslation } from 'react-i18next';
import { bboxOf, makeProjection, svgPath } from './projectPath';

const WIDTH = 400;

interface LocatorMapProps {
  kennedy: Geometry;
  tintal: Geometry;
}

/**
 * Mapa de ubicación: El Tintal resaltado dentro del contorno de Kennedy (SVG con los tokens de la
 * interfaz, sin teselas; [PROPUESTA] frente a D83, que pide el tema de los mapas). El Tintal va en su
 * token de dato resaltado (--figure-highlight: rosa; blanco en alto contraste), no en el de selección,
 * con la línea del texto de 2 px reales, que lo recorta sobre la crema de Kennedy a ≥ 3:1 (WCAG 1.4.11,
 * PAL-05): el rosa solo no llega (1,65:1). La leyenda repite relleno y borde de cada área.
 */
export function LocatorMap({ kennedy, tintal }: LocatorMapProps) {
  const { t } = useTranslation();
  const { height, project } = makeProjection(bboxOf(kennedy), WIDTH);

  return (
    <figure className="m-0 flex flex-col gap-3">
      <svg
        viewBox={`0 0 ${WIDTH} ${height.toFixed(0)}`}
        role="img"
        aria-label={t('history.locator.label')}
        className="w-full max-w-md"
      >
        <path d={svgPath(kennedy, project)} className="fill-surface stroke-line-strong" strokeWidth={1.5} />
        <path d={svgPath(tintal, project)} className="fill-figure stroke-fg" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
      <figcaption className="flex flex-wrap gap-4 text-step--1 text-fg-secondary">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-block size-3 rounded-sm border border-line-strong bg-surface" />
          {t('history.locator.kennedy')}
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-block size-3 rounded-sm border border-fg bg-figure" />
          {t('history.locator.tintal')}
        </span>
      </figcaption>
    </figure>
  );
}
