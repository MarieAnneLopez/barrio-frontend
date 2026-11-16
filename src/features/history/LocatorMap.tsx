import type { Geometry } from 'geojson';
import { useTranslation } from 'react-i18next';
import { bboxOf, makeProjection, svgPath } from './projectPath';

const WIDTH = 400;

interface LocatorMapProps {
  kennedy: Geometry;
  tintal: Geometry;
}

/** Mapa de ubicación: El Tintal resaltado dentro del contorno de Kennedy (SVG, sin teselas). */
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
        <path d={svgPath(tintal, project)} className="fill-pink/60 stroke-pink" strokeWidth={2} />
      </svg>
      <figcaption className="flex flex-wrap gap-4 text-step--1 text-fg-secondary">
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-block size-3 rounded-sm border border-line-strong bg-surface" />
          {t('history.locator.kennedy')}
        </span>
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className="inline-block size-3 rounded-sm border border-ink bg-pink" />
          {t('history.locator.tintal')}
        </span>
      </figcaption>
    </figure>
  );
}
