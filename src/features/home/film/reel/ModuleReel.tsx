import './reel.css';
import './reel-title.css';
import { useId, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useToneSection } from '../../../../components/layout/useHeaderLook';
import { useReducedMotion } from '../../../../hooks/useReducedMotion';
import { CATEGORIES } from '../../../../lib/categoryConfig';
import { coverNumber } from './coverLayout';
import { ReelGrid } from './ReelGrid';
import { useModuleReel } from './useModuleReel';

/**
 * Capítulo 4 del Inicio (etapa 3): reel curvo en WebGL con los 14 módulos del barrio. La sección mide
 * 300svh: una pantalla sticky y 200svh de recorrido que el scroll nativo convierte en avance; también
 * se explora arrastrando, con las flechas y Home, y la tarjeta central se abre con clic o Enter.
 * El motor (three) se descarga aparte al acercarse el capítulo: hasta que llega, y si no hay WebGL,
 * se ve una rejilla de enlaces a los 14 módulos. Con movimiento reducido no hay recorrido ni animación.
 */
export function ModuleReel() {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  useToneSection(section);
  const covers = useMemo(
    () => CATEGORIES.map((category) => ({ number: coverNumber(category.id), name: t(`categories.${category.slug}.name`) })),
    [t],
  );
  const reel = useModuleReel(section, stage, frame, covers, reduced);
  const descriptionId = useId();
  const live = reel.mode === 'reel';
  const [first, ...rest] = t('app.shortTitle').split(' ');

  return (
    <section
      ref={section}
      data-chapter="4"
      data-tone="papel"
      data-header-float
      data-mode={reel.mode}
      onPointerEnter={reel.need}
      onFocus={reel.need}
      className="reel tone-papel"
    >
      <div ref={stage} className="reel-stage">
        {/* El titular va en dos trozos: con el reel, cada uno asoma por una esquina de la tarjeta central. */}
        <h2 className="reel-title">
          <span>{first}</span> <span>{rest.join(' ')}</span>
        </h2>
        {/* El contenedor del lienzo existe antes que el motor, oculto, para que este tenga dónde montarse. */}
        {reel.mode === 'grid' ? null : (
          <div
            ref={frame}
            className="reel-frame"
            onKeyDown={reel.onKeyDown}
            onFocus={reel.onFocus}
            onBlur={reel.onBlur}
            {...(live
              ? { role: 'group', tabIndex: 0, 'aria-label': t('home.reel.label'), 'aria-describedby': descriptionId }
              : { 'aria-hidden': true })}
          />
        )}
        {live ? (
          <>
            {/* Descripción viva: se anuncia sola solo con el foco en el reel, no al pasar con el scroll. */}
            <p id={descriptionId} aria-live={reel.focused ? 'polite' : 'off'} className="sr-only">
              {t('home.reel.current', { n: reel.index + 1, total: covers.length, name: covers[reel.index]?.name ?? '' })}
            </p>
            <p className="reel-hint">{t('home.reel.hint')}</p>
          </>
        ) : (
          <ReelGrid covers={covers} />
        )}
      </div>
    </section>
  );
}
