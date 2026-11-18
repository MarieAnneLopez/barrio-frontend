import { useRef } from 'react';
import { useToneSection } from '../../../../components/layout/useHeaderLook';
import { HeroSection } from '../../HeroSection';

/**
 * Capítulo 3 del Inicio (etapa 3): la maqueta 3D a pantalla completa. Un recuadro `sticky` de
 * 100svh dentro de una sección de 200svh: una pantalla de permanencia y otra de paso. No crea otro
 * lienzo: HeroSection acoge el de ScenePortal, que solo dibuja mientras se ve. El header va sólido
 * (no se declara flotante): tras su texto pasarían las vías claras del mapa, por debajo de 4,5:1.
 */
export function ModelStage() {
  const section = useRef<HTMLElement>(null);
  useToneSection(section);
  return (
    <section ref={section} data-chapter="3" data-tone="noche" className="relative h-[200svh]">
      <div className="sticky top-0 h-svh">
        <HeroSection />
      </div>
    </section>
  );
}
