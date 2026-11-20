import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from '../../components/ui/Skeleton';
import { useStageSlot } from '../map/stage/useStageSlot';
import { useTintal3D } from '../../three/data/useTintal3D';
import { HeroHud } from './HeroHud';
import { SittingMarie } from './SittingMarie';

/** La rueda sin Ctrl ni ⌘ no llega a los controles de la maqueta: desplaza la página. Sin preventDefault. */
function scrollsThePage(event: WheelEvent) {
  if (!event.ctrlKey && !event.metaKey) event.stopPropagation();
}

/**
 * Recuadro de la maqueta 3D del capítulo 3 del Inicio, con su HUD. La escena vive en el shell
 * (ScenePortal, D83): aquí solo se le presta el recuadro (modo «cine»), así no se recrea al cambiar
 * de sección. Ocupa todo su contenedor sticky, con HUD sobrio y la rueda reservada al scroll (se
 * acerca con Ctrl/⌘ + rueda, el pellizco del panel táctil o dos dedos). Las secciones con mapa
 * usan su propio escenario (features/map/stage/MapStage).
 */
export function HeroSection() {
  const { t } = useTranslation();
  const state = useTintal3D(); // datos estáticos; reintenta sola: nunca muestra un error
  const section = useRef<HTMLElement>(null);
  const slot = useStageSlot(section, 'cine');

  useEffect(() => {
    const node = slot.current;
    if (!node) return undefined;
    node.addEventListener('wheel', scrollsThePage, { capture: true, passive: true });
    return () => node.removeEventListener('wheel', scrollsThePage, { capture: true });
  }, [slot]);

  return (
    // El recuadro recorta su contenido (overflow-hidden): Mini Marie va afuera, arriba a la derecha (D88).
    <div className="relative h-full">
      <section
        ref={section}
        data-hero
        aria-label={t('hero.label')}
        aria-describedby="hero-descripcion"
        className="relative h-full overflow-hidden bg-[var(--map-fondo)]"
      >
        <p id="hero-descripcion" className="sr-only">
          {t('hero.description')}
        </p>
        <div ref={slot} data-scene-slot className="absolute inset-0" />
        {state.status === 'loading' ? <Skeleton className="h-full w-full" /> : <HeroHud sober legend={null} />}
      </section>
      <SittingMarie stage />
    </div>
  );
}
