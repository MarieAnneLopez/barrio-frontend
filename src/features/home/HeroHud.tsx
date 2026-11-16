import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { categoryPath } from '../../lib/categoryConfig';
import { useHeroStore } from '../../three/heroStore';

const label = 'font-mono text-[0.75rem] tracking-[0.18em] text-fg-muted uppercase';
const panel = 'ui-panel pointer-events-auto px-3 py-2';

/**
 * HUD de la maqueta (ref. visual 1): paneles en los bordes, nunca al centro. Todo va en una sola
 * columna (fila de arriba, leyenda y fila de abajo) cuyas filas saltan de línea y cuya leyenda cede
 * el alto: ningún panel puede montarse sobre otro, a ningún ancho (D88). Los huecos no reciben
 * eventos, para poder arrastrar la maqueta.
 */
export function HeroHud({ legend }: { legend: ReactNode }) {
  const { t, i18n } = useTranslation();
  const { paused, hovered, selected, togglePaused, select, recenter } = useHeroStore();
  const touch = useMediaQuery('(pointer: coarse)', false);
  const numbers = new Intl.NumberFormat(i18n.language);

  return (
    <div className="pointer-events-none absolute inset-4 z-30 flex flex-col gap-3">
      <div className="flex flex-wrap items-start gap-2">
        <div className={`${panel} flex flex-col gap-1`}>
          <p className={`m-0 ${label}`}>{t('hero.eyebrow')}</p>
          <p className="m-0 font-mono text-step--1 text-fg-secondary">{t('hero.coords')}</p>
        </div>
        <div className="pointer-events-auto ml-auto flex flex-wrap justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={recenter}>
            {t('hero.recenter')}
          </Button>
          <Button variant="secondary" size="sm" aria-pressed={paused} onClick={togglePaused}>
            {paused ? t('hero.play') : t('hero.pause')}
          </Button>
        </div>
      </div>
      {legend}
      <div className="mt-auto flex flex-wrap items-end gap-2">
        <div className={`${panel} max-w-[22rem]`} aria-live="polite">
          {hovered ? (
            <p className="m-0 font-mono text-step--1 text-fg">
              {t('hero.building')} · {t(`hero.buildingKind.${hovered.kind ?? 'yes'}`, { defaultValue: hovered.kind ?? '' })}
              {' · '}
              {t('hero.levels', { count: hovered.levels })} · {t('hero.area', { value: numbers.format(Math.round(hovered.areaM2)) })}
            </p>
          ) : (
            <p className="m-0 text-step--1 text-fg-secondary">{t(touch ? 'hero.touchHint' : 'hero.hint')}</p>
          )}
          <p className={`m-0 mt-1 ${label}`}>{t('hero.source')}</p>
        </div>
        {selected ? (
          <section aria-label={t('hero.placeCard')} className={`${panel} ml-auto flex max-w-[20rem] flex-col gap-2 p-4`}>
            <p className={`m-0 ${label}`}>{t('hero.placeCard')}</p>
            <h2 className="m-0 text-step-1 text-fg">
              <span aria-hidden="true">{selected.emoji} </span>
              {selected.name}
            </h2>
            <div className="flex flex-wrap gap-2">
              <Link
                to={categoryPath(selected.slug)}
                className="ui-pressable ui-btn--primary inline-flex min-h-9 items-center rounded-md border border-interactive bg-interactive px-3 text-step--1 text-on-interactive no-underline"
              >
                {t('hero.openModule', { module: t(`categories.${selected.slug}.name`) })}
              </Link>
              <Button variant="ghost" size="sm" onClick={() => select(null)}>
                {t('hero.closePlace')}
              </Button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
