import { useEffect, useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '../../components/ui/Skeleton';
import { useSceneHost } from '../../three/sceneHost';
import { useTintalData } from '../../three/useTintalData';
import { HeroHud } from './HeroHud';
import { HeroLegend } from './HeroLegend';
import { SittingMarie } from './SittingMarie';

/**
 * Hero Stage (§11.1.1): maqueta 3D de El Tintal a 72–80vh con HUD de vidrio.
 * En /mapa (variant="page") ocupa casi toda la pantalla. La escena vive en el shell
 * (ScenePortal, D83): aquí solo se le presta el recuadro, así no se recrea al cambiar de sección.
 */
export function HeroSection({ variant = 'hero' }: { variant?: 'hero' | 'page' }) {
  const { t } = useTranslation();
  const state = useTintalData(); // reintenta sola: nunca muestra un error
  const section = useRef<HTMLElement>(null);
  const slot = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const { attach, detach } = useSceneHost.getState();
    if (slot.current) attach(slot.current);
    return detach;
  }, []);

  // Fuera de pantalla no se dibujan cuadros.
  useEffect(() => {
    const node = section.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => useSceneHost.getState().setVisible(entry?.isIntersecting ?? true));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    // El recuadro recorta su contenido (overflow-hidden): la sentada va afuera, sobre su borde superior,
    // casi en la esquina derecha (D82, D88).
    <div className="relative">
      <section
        ref={section}
        data-hero
        aria-label={t('hero.label')}
        aria-describedby="hero-descripcion"
        className={`relative -mx-4 ${variant === 'page' ? 'h-[calc(100dvh-12rem)] min-h-[480px]' : 'h-[72vh] min-h-[420px] md:h-[78vh]'} overflow-hidden border-y border-line-strong bg-[var(--map-fondo)] md:mx-0 md:rounded-sm md:border`}
      >
        <p id="hero-descripcion" className="sr-only">
          {t('hero.description')}
        </p>
        <div ref={slot} className="absolute inset-0" />
        {state.status === 'loading' ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <HeroHud legend={<HeroLegend defaultOpen={variant === 'page'} />} />
        )}
      </section>
      <SittingMarie />
    </div>
  );
}
