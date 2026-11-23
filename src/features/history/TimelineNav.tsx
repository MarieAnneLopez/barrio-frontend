import { useEffect, useRef, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';

type TimelineNavProps = {
  activeIndex: number;
  total: number;
  prev: () => void;
  next: () => void;
};

/** Controles del escenario, acotados al grupo para no secuestrar las flechas globales. */
export function TimelineNav({ activeIndex, total, prev, next }: TimelineNavProps) {
  const { t } = useTranslation();
  const prevButton = useRef<HTMLButtonElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const canPrev = activeIndex > 0;
  const canNext = activeIndex < total - 1;

  useEffect(() => {
    if (!canPrev && document.activeElement === prevButton.current) nextButton.current?.focus();
    if (!canNext && document.activeElement === nextButton.current) prevButton.current?.focus();
  }, [canNext, canPrev]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft' && canPrev) { event.preventDefault(); prev(); }
    if (event.key === 'ArrowRight' && canNext) { event.preventDefault(); next(); }
  };

  return (
    // Mismo lenguaje visual que la paginación del sitio (Pagination): botón secundario y posición en mono.
    <div role="group" data-hinge-nav aria-label={t('history.hinge.nav')} onKeyDown={onKeyDown}
      className="flex w-full max-w-3xl items-center justify-between gap-3">
      <Button ref={prevButton} variant="secondary" className="hinge-nav__btn min-w-11" disabled={!canPrev} onClick={prev}
        icon={<span aria-hidden="true">←</span>}>
        <span className="sr-only sm:not-sr-only">{t('history.hinge.prev')}</span>
      </Button>
      <p className="m-0 whitespace-nowrap font-mono text-step--1 text-fg-muted" aria-live="polite">
        {t('history.hinge.position', { current: activeIndex + 1, total })}
      </p>
      <Button ref={nextButton} variant="secondary" className="hinge-nav__btn min-w-11 flex-row-reverse" disabled={!canNext}
        onClick={next} icon={<span aria-hidden="true">→</span>}>
        {/* En móvil solo se ve la flecha; el nombre accesible sigue siendo el texto completo. */}
        <span className="sr-only sm:not-sr-only">{t('history.hinge.next')}</span>
      </Button>
    </div>
  );
}
