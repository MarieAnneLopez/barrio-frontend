import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '../../components/ui/Skeleton';
import { LoadingTask } from '../../components/avatar/LoadingTask';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useA11yStore } from '../../store/a11yStore';
import { useTintalData } from '../../three/useTintalData';
import { HeroHud } from './HeroHud';
import { HeroLegend } from './HeroLegend';
import { SittingMarie } from './SittingMarie';

// three + r3f se cargan aparte: el resto del sitio no paga su peso.
const TintalScene = lazy(() => import('../../three/TintalScene'));

/**
 * Hero Stage (§11.1.1): maqueta 3D de El Tintal a 72–80vh con HUD de vidrio.
 * En /mapa (variant="page") ocupa casi toda la pantalla.
 */
export function HeroSection({ variant = 'hero' }: { variant?: 'hero' | 'page' }) {
  const { t } = useTranslation();
  const state = useTintalData(); // reintenta sola: nunca muestra un error
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
    // El recuadro recorta su contenido (overflow-hidden): la sentada va afuera, sobre su borde (D82).
    <div className="relative">
      <section
        ref={section}
        data-hero
        aria-label={t('hero.label')}
        aria-describedby="hero-descripcion"
        className={`relative -mx-4 ${variant === 'page' ? 'h-[calc(100dvh-12rem)] min-h-[480px]' : 'h-[72vh] min-h-[420px] md:h-[78vh]'} overflow-hidden rounded-none border-y-[10px] border-stone bg-surface md:mx-0 md:rounded-sm md:border-[12px] md:shadow-[0_0_0_2px_var(--border-ink),6px_6px_0_2px_var(--border-ink)]`}
      >
        <p id="hero-descripcion" className="sr-only">
          {t('hero.description')}
        </p>
        {state.status === 'loading' ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <>
            <Suspense fallback={<><LoadingTask /><Skeleton className="h-full w-full" /></>}>
              <TintalScene data={state.data} active={visible} reducedMotion={reducedMotion} />
            </Suspense>
            <HeroHud />
            <HeroLegend defaultOpen={variant === 'page'} />
          </>
        )}
      </section>
      <SittingMarie />
    </div>
  );
}
