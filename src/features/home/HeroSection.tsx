import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useA11yStore } from '../../store/a11yStore';
import { useTintalData } from '../../three/useTintalData';
import { HeroHud } from './HeroHud';

// three + r3f se cargan aparte: el resto del sitio no paga su peso.
const TintalScene = lazy(() => import('../../three/TintalScene'));

/** Hero Stage (§11.1.1): maqueta 3D de El Tintal a 72–80vh con HUD de vidrio. */
export function HeroSection() {
  const { t } = useTranslation();
  const [attempt, setAttempt] = useState(0);
  const state = useTintalData(attempt);
  const section = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(true);
  const systemReduced = useMediaQuery('(prefers-reduced-motion: reduce)', false);
  const reducedMotion = useA11yStore((s) => s.reducedMotion) || systemReduced;

  // Fuera de pantalla no se dibujan cuadros.
  useEffect(() => {
    const node = section.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? true));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={section}
      data-hero
      aria-label={t('hero.label')}
      aria-describedby="hero-descripcion"
      className="relative -mx-4 h-[72vh] min-h-[420px] overflow-hidden rounded-none border-y border-line bg-bg md:mx-0 md:h-[78vh] md:rounded-lg md:border"
    >
      <p id="hero-descripcion" className="sr-only">
        {t('hero.description')}
      </p>
      {state.status === 'error' ? (
        <div role="alert" className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="m-0 text-fg-secondary">{t('hero.error')}</p>
          <Button variant="secondary" size="sm" onClick={() => setAttempt((n) => n + 1)}>
            {t('modules.retry')}
          </Button>
        </div>
      ) : state.status === 'loading' ? (
        <Skeleton className="h-full w-full" />
      ) : (
        <>
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <TintalScene data={state.data} active={visible} reducedMotion={reducedMotion} />
          </Suspense>
          <HeroHud />
        </>
      )}
    </section>
  );
}
