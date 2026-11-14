import './carousel.css';
import { useCallback, useEffect, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { CarouselSlide } from './CarouselSlide';
import { CAROUSEL_PHOTOS } from './carouselPhotos';
import { useSwipe } from './useSwipe';

const INTERVAL_MS = 6500;

/**
 * Carrusel del entorno (§11.1.2) según el patrón WAI-ARIA de carrusel con
 * rotación: botón de pausa primero (WCAG 2.2.2), pausa con hover/foco,
 * flechas, teclado, swipe e indicadores. aria-live solo cuando está en pausa.
 */
export function NeighborhoodCarousel() {
  const { t } = useTranslation();
  const total = CAROUSEL_PHOTOS.length;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hold, setHold] = useState(false);
  const next = useCallback(() => setIndex((i) => (i + 1) % total), [total]);
  const previous = useCallback(() => setIndex((i) => (i - 1 + total) % total), [total]);
  const swipe = useSwipe(next, previous);
  const rotating = playing && !hold;

  useEffect(() => {
    if (!rotating) return undefined;
    const timer = window.setTimeout(next, INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [rotating, index, next]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') next();
    else if (event.key === 'ArrowLeft') previous();
  };

  return (
    <section
      aria-roledescription={t('carousel.roledescription')}
      aria-label={t('carousel.label')}
      onKeyDown={onKeyDown}
      onPointerEnter={() => setHold(true)}
      onPointerLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setHold(false)}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="secondary" size="sm" aria-pressed={!playing} onClick={() => setPlaying((p) => !p)}>
          {playing ? t('carousel.pause') : t('carousel.play')}
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={previous}>{t('carousel.previous')}</Button>
          <Button variant="secondary" size="sm" onClick={next}>{t('carousel.next')}</Button>
        </div>
      </div>
      <div
        {...swipe}
        aria-live={rotating ? 'off' : 'polite'}
        className="relative aspect-[4/3] touch-pan-y overflow-hidden rounded-lg border border-line bg-surface md:aspect-[16/9]"
      >
        {CAROUSEL_PHOTOS.map((photo, i) => (
          <CarouselSlide key={photo.id} photo={photo} index={i} total={total} active={i === index} />
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-1">
        {CAROUSEL_PHOTOS.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            aria-label={t('carousel.goTo', { n: i + 1 })}
            aria-current={i === index}
            onClick={() => setIndex(i)}
            className="ui-pressable inline-flex size-11 items-center justify-center rounded-full"
          >
            <span aria-hidden="true" className="carousel-dot" />
          </button>
        ))}
      </div>
    </section>
  );
}
