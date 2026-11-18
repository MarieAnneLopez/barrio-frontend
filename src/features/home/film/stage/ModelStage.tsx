import { useRef } from 'react';
import { useToneSection } from '../../../../components/layout/useHeaderLook';
import { useNearViewport } from '../../../../hooks/useNearViewport';
import { HeroSection } from '../../HeroSection';

/**
 * Capítulo 3 del Inicio (etapa 3): la maqueta 3D a pantalla completa. Un recuadro `sticky` de
 * 100svh dentro de una sección de 200svh: una pantalla de permanencia y otra de paso. No crea otro
 * lienzo: HeroSection acoge el de ScenePortal, que solo dibuja mientras se ve. El header va sólido
 * (no se declara flotante): tras su texto pasarían las vías claras del mapa, por debajo de 4,5:1.
 * La maqueta (datos y código, ~700 KB) se pide a tres pantallas de llegar (D112): queda lista antes
 * de verse, pero no compite con el arranque del Inicio, que está diez pantallas más arriba.
 */
export function ModelStage() {
  const section = useRef<HTMLElement>(null);
  useToneSection(section);
  const near = useNearViewport(section, true, '300% 0px');
  return (
    <section ref={section} data-chapter="3" data-tone="noche" className="relative h-[200svh]">
      <div className="sticky top-0 h-svh">
        {near ? <HeroSection /> : <div className="h-full bg-[var(--map-fondo)]" />}
      </div>
    </section>
  );
}
