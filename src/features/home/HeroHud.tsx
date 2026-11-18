import { useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useHeroStore } from '../../three/heroStore';
import { MapSources } from '../map/card/MapSources';
import { SelectionCard } from '../map/card/SelectionCard';
import { useHoverLabel } from '../map/card/useHoverLabel';

const label = 'font-mono text-step--1 tracking-[0.18em] text-fg-muted uppercase';
const panel = 'ui-panel pointer-events-auto px-3 py-2';

/**
 * HUD de la maqueta (ref. visual 1): paneles en los bordes, nunca al centro. Todo va en una sola
 * columna (fila de arriba, leyenda y fila de abajo) cuyas filas saltan de línea y cuya leyenda cede
 * el alto: ningún panel puede montarse sobre otro, a ningún ancho (D88). Los huecos no reciben
 * eventos, para poder arrastrar la maqueta. `sober` es el del capítulo 3 del Inicio, a pantalla
 * completa: sin leyenda ni texto de ayuda, bajo el header, con la esquina superior derecha para Mini
 * Marie y la fila de abajo fuera del sitio del chat, WhatsApp y la barra de accesibilidad. La ficha
 * de lo elegido (edificio o lugar) y la línea de lo que está bajo el puntero leen selectionStore.
 */
export function HeroHud({ legend, sober = false }: { legend: ReactNode; sober?: boolean }) {
  const { t } = useTranslation();
  const { paused, togglePaused, recenter } = useHeroStore();
  const hovered = useHoverLabel();
  const touch = useMediaQuery('(pointer: coarse)', false);
  const recenterButton = useRef<HTMLButtonElement>(null);

  return (
    <div className={`pointer-events-none absolute z-30 flex flex-col gap-3 ${sober ? 'inset-x-4 top-20 bottom-24 md:bottom-4' : 'inset-4'}`}>
      <div className={`flex flex-wrap items-start gap-2 ${sober ? 'pr-14' : ''}`}>
        <div className={`${panel} flex flex-col gap-1`}>
          <p className={`m-0 ${label}`}>{t('hero.eyebrow')}</p>
          <p className="m-0 font-mono text-step--1 text-fg-secondary">{t('hero.coords')}</p>
        </div>
        <div className="pointer-events-auto ml-auto flex flex-wrap justify-end gap-2">
          <Button ref={recenterButton} variant="secondary" size="sm" onClick={recenter}>
            {t('hero.recenter')}
          </Button>
          <Button variant="secondary" size="sm" aria-pressed={paused} onClick={togglePaused}>
            {paused ? t('hero.play') : t('hero.pause')}
          </Button>
        </div>
      </div>
      {legend}
      <div className={`mt-auto flex min-h-0 flex-wrap items-end gap-2 ${sober ? 'pr-14 md:pr-40' : ''}`}>
        <div className={`${panel} max-w-[22rem]`} aria-live="polite">
          {hovered ? <p className="m-0 font-mono text-step--1 text-fg">{hovered}</p> : null}
          {hovered || sober ? null : (
            <p className="m-0 text-step--1 text-fg-secondary">{t(touch ? 'hero.touchHint' : 'hero.hint')}</p>
          )}
          {/* La misma cita de las fichas (D105): licencia enlazada y «datos modificados» (FORMATO.md §8). */}
          <div className={hovered || !sober ? 'mt-1' : ''}>
            <MapSources bare />
          </div>
        </div>
        <SelectionCard returnFocus={recenterButton} className="ml-auto max-h-[min(60svh,32rem)] w-[min(22rem,100%)]" />
      </div>
    </div>
  );
}
