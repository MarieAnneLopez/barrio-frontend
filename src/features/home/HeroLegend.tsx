import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CATEGORIES } from '../../lib/categoryConfig';
import { useHeroStore } from '../../three/heroStore';
import { DEFAULT_SHAPE, SHAPE_STYLE } from '../../three/shapeStyle';
import { LegendMarker } from './LegendMarker';
import { ShapeSwatch } from './ShapeSwatch';

/**
 * Leyenda y filtro de la maqueta (H34): las 14 categorías con su símbolo y los lugares
 * que la escena dibujó; cada una se puede ocultar. Es HTML real: teclado y lector de pantalla.
 * Va dentro de la columna del HUD y cede el alto (min-h-0): su lista se desplaza y
 * nunca tapa la pista de abajo (D88).
 */
export function HeroLegend({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const { t, i18n } = useTranslation();
  const listId = useId();
  const [open, setOpen] = useState(defaultOpen);
  const { hidden, drawn, toggleCategory } = useHeroStore();
  const numbers = new Intl.NumberFormat(i18n.language);

  return (
    <div className="ui-panel pointer-events-auto flex min-h-0 w-[min(18rem,100%)] flex-col self-start">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="ui-pressable ui-btn--ghost flex min-h-11 items-center justify-between gap-2 border border-transparent px-3 text-step--1 font-semibold text-fg"
      >
        {t('hero.legend.title')}
        <span aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      <ul id={listId} hidden={!open} aria-label={t('hero.legend.title')} className="m-0 flex list-none flex-col gap-1 overflow-y-auto p-2 pt-0">
        {CATEGORIES.map(({ slug, emoji, geometry }) => {
          const shown = !hidden.includes(slug);
          const count = drawn[slug];
          const name = t(`categories.${slug}.name`);
          return (
            <li key={slug} data-slug={slug} data-drawn={count ?? ''}>
              <button
                type="button"
                aria-pressed={shown}
                onClick={() => toggleCategory(slug)}
                className={`ui-pressable flex min-h-11 w-full items-center gap-2 rounded-sm border px-2 text-left text-step--1 ${
                  shown ? 'border-ink bg-stone text-on-stone' : 'ui-btn--ghost border-transparent text-fg line-through'
                }`}
              >
                {geometry === 'POINT' ? (
                  <LegendMarker slug={slug} emoji={emoji} />
                ) : (
                  <ShapeSwatch style={SHAPE_STYLE[slug] ?? DEFAULT_SHAPE} />
                )}
                <span className="min-w-0 flex-1">{name}</span>
                <span className="font-mono">
                  {count === undefined ? t('hero.legend.noData') : numbers.format(count)}
                </span>
                <span className="sr-only">{shown ? t('hero.legend.visible') : t('hero.legend.hidden')}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
