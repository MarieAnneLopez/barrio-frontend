import { useEffect, useRef, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

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
    <div role="group" data-hinge-nav aria-label={t('history.hinge.nav', { defaultValue: 'Navegación de hitos' })} onKeyDown={onKeyDown}>
      <button ref={prevButton} type="button" className="hinge-nav__btn min-h-11 min-w-11" aria-label={t('history.hinge.prev', { defaultValue: 'Hito anterior' })} disabled={!canPrev} onClick={prev}>←</button>
      <span aria-live="polite">{t('history.hinge.position', { defaultValue: 'Hito {{current}} de {{total}}', current: activeIndex + 1, total })}</span>
      <button ref={nextButton} type="button" className="hinge-nav__btn min-h-11 min-w-11" aria-label={t('history.hinge.next', { defaultValue: 'Hito siguiente' })} disabled={!canNext} onClick={next}>→</button>
    </div>
  );
}
