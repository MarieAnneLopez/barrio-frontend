import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CATEGORIES, categoryPath } from '../../lib/categoryConfig';
import { useHeroStore } from '../../three/heroStore';
import { DEFAULT_SHAPE, SHAPE_STYLE } from '../../three/shapeStyle';
import { LegendMarker } from '../home/LegendMarker';
import { ShapeSwatch } from '../home/ShapeSwatch';

/**
 * Leyenda y filtro de Mapa 3D (H34), en el panel del escenario: las 14 categorías con su símbolo y
 * los lugares reales que la escena dibujó; cada una se oculta o se muestra, y la flecha abre su
 * sección (su lista y su mapa). Es HTML real: teclado y lector de pantalla.
 */
export function MapLegend() {
  const { t, i18n } = useTranslation();
  const titleId = useId();
  const { hidden, drawn, toggleCategory } = useHeroStore();
  const numbers = new Intl.NumberFormat(i18n.language);

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-2">
      <h2 id={titleId} className="m-0 font-sans text-step-0 font-semibold text-fg">{t('hero.legend.title')}</h2>
      <p className="m-0 text-step--1">{t('stage.legendHint')}</p>
      <ul aria-label={t('hero.legend.title')} className="m-0 flex list-none flex-col gap-1 p-0">
        {CATEGORIES.map(({ slug, emoji, geometry }) => {
          const shown = !hidden.includes(slug);
          const count = drawn[slug];
          const name = t(`categories.${slug}.name`);
          return (
            <li key={slug} data-slug={slug} data-drawn={count ?? ''} className="flex items-stretch gap-1">
              <button
                type="button"
                aria-pressed={shown}
                onClick={() => toggleCategory(slug)}
                className={`ui-pressable flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-sm border px-2 text-left text-step--1 ${
                  shown ? 'border-ink bg-stone text-on-stone' : 'ui-btn--ghost border-transparent text-fg line-through'
                }`}
              >
                {geometry === 'POINT' ? (
                  <LegendMarker slug={slug} emoji={emoji} />
                ) : (
                  <ShapeSwatch style={SHAPE_STYLE[slug] ?? DEFAULT_SHAPE} />
                )}
                <span className="min-w-0 flex-1">{name}</span>
                <span className="font-mono">{count === undefined ? t('hero.legend.noData') : numbers.format(count)}</span>
                <span className="sr-only">{shown ? t('hero.legend.visible') : t('hero.legend.hidden')}</span>
              </button>
              <Link
                to={categoryPath(slug)}
                aria-label={t('stage.openModule', { module: name })}
                className="ui-pressable ui-btn--ghost inline-flex size-11 shrink-0 items-center justify-center rounded-sm border border-line text-fg no-underline"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3 8h9M8.5 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.75" />
                </svg>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
