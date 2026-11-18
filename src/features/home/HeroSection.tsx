import { useEffect, useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '../../components/ui/Skeleton';
import { useSceneHost } from '../../three/sceneHost';
import { useTintal3D } from '../../three/data/useTintal3D';
import { HeroHud } from './HeroHud';
import { HeroLegend } from './HeroLegend';
import { SittingMarie } from './SittingMarie';

type Variant = 'page' | 'stage';

const FRAME: Record<Variant, string> = {
  // Mapa 3D: recuadro casi a pantalla completa, con una línea de 1 px.
  page: '-mx-4 h-[calc(100dvh-12rem)] min-h-[480px] border-y border-line-strong md:mx-0 md:rounded-sm md:border',
  // Inicio (capítulo 3): ocupa todo su contenedor sticky, sin marco.
  stage: 'h-full',
};

/** La rueda sin Ctrl ni ⌘ no llega a los controles de la maqueta: desplaza la página. Sin preventDefault. */
function scrollsThePage(event: WheelEvent) {
  if (!event.ctrlKey && !event.metaKey) event.stopPropagation();
}

/**
 * Recuadro de la maqueta 3D de El Tintal con su HUD. La escena vive en el shell (ScenePortal, D83):
 * aquí solo se le presta el recuadro, así no se recrea al cambiar de sección. `page` es el de
 * Mapa 3D; `stage`, el del capítulo 3 del Inicio: a pantalla completa, con HUD sobrio y la rueda
 * reservada al scroll (se acerca con Ctrl/⌘ + rueda, el pellizco del panel táctil o dos dedos).
 */
export function HeroSection({ variant = 'page' }: { variant?: Variant }) {
  const { t } = useTranslation();
  const state = useTintal3D(); // datos estáticos; reintenta sola: nunca muestra un error
  const section = useRef<HTMLElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  const stage = variant === 'stage';

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

  useEffect(() => {
    const node = slot.current;
    if (!stage || !node) return undefined;
    node.addEventListener('wheel', scrollsThePage, { capture: true, passive: true });
    return () => node.removeEventListener('wheel', scrollsThePage, { capture: true });
  }, [stage]);

  return (
    // El recuadro recorta su contenido (overflow-hidden): Mini Marie va afuera, arriba a la derecha (D88).
    <div className={`relative ${stage ? 'h-full' : ''}`}>
      <section
        ref={section}
        data-hero
        aria-label={t('hero.label')}
        aria-describedby="hero-descripcion"
        className={`relative overflow-hidden bg-[var(--map-fondo)] ${FRAME[variant]}`}
      >
        <p id="hero-descripcion" className="sr-only">
          {t('hero.description')}
        </p>
        <div ref={slot} data-scene-slot className="absolute inset-0" />
        {state.status === 'loading' ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <HeroHud sober={stage} legend={stage ? null : <HeroLegend defaultOpen />} />
        )}
      </section>
      <SittingMarie stage={stage} />
    </div>
  );
}
