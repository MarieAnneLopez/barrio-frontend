import { createPortal } from 'react-dom';
import { Skeleton } from '../../components/ui/Skeleton';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useA11yStore } from '../../store/a11yStore';
import { useTintal3D } from '../../three/data/useTintal3D';
import { sceneHostElement, useSceneHost } from '../../three/sceneHost';
import { useSceneModule } from '../../three/sceneModule';
import { useTintalData } from '../../three/useTintalData';

function SceneMount() {
  const scene = useSceneModule(); // se pide a la vez que los datos, no después
  const world = useTintal3D();
  const api = useTintalData();
  const active = useSceneHost((s) => s.attached && s.visible);
  const systemReduced = useMediaQuery('(prefers-reduced-motion: reduce)', false);
  const reducedMotion = useA11yStore((s) => s.reducedMotion) || systemReduced;
  if (world.status !== 'ready') return null;
  const places = api.status === 'ready' ? api.data.categories : null;
  const Scene = scene?.default;
  return createPortal(
    Scene ? (
      <Scene world={world.data} places={places} active={active} reducedMotion={reducedMotion} />
    ) : (
      <Skeleton className="h-full w-full" />
    ),
    sceneHostElement(),
  );
}

/**
 * Maqueta 3D persistente (D83): vive en el shell, no en la página. Se monta la primera vez que
 * una sección la pide (Inicio o Mapa 3D) y no se vuelve a crear al cambiar de sección: solo deja
 * de dibujar cuando su contenedor no está en pantalla. Al cerrar la app, React la desmonta y cada
 * capa libera sus geometrías y texturas. Se dibuja en cuanto llegan sus datos estáticos (TNT3,
 * D105); los lugares de los módulos se suman cuando la API responde.
 */
export function ScenePortal() {
  const requested = useSceneHost((s) => s.requested);
  return requested ? <SceneMount /> : null;
}
