import { lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { LoadingTask } from '../../components/avatar/LoadingTask';
import { Skeleton } from '../../components/ui/Skeleton';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useA11yStore } from '../../store/a11yStore';
import { sceneHostElement, useSceneHost } from '../../three/sceneHost';
import { useTintalData } from '../../three/useTintalData';

// three + r3f se cargan aparte: el resto del sitio no paga su peso.
const TintalScene = lazy(() => import('../../three/TintalScene'));

function SceneMount() {
  const state = useTintalData();
  const active = useSceneHost((s) => s.attached && s.visible);
  const systemReduced = useMediaQuery('(prefers-reduced-motion: reduce)', false);
  const reducedMotion = useA11yStore((s) => s.reducedMotion) || systemReduced;
  if (state.status !== 'ready') return null;
  return createPortal(
    <Suspense fallback={<><LoadingTask /><Skeleton className="h-full w-full" /></>}>
      <TintalScene data={state.data} active={active} reducedMotion={reducedMotion} />
    </Suspense>,
    sceneHostElement(),
  );
}

/**
 * Maqueta 3D persistente (D83): vive en el shell, no en la página. Se monta la primera vez que
 * una sección la pide (Inicio o Mapa 3D) y no se vuelve a crear al cambiar de sección: solo deja
 * de dibujar cuando su contenedor no está en pantalla. Al cerrar la app, React la desmonta y cada
 * capa libera sus geometrías y texturas.
 */
export function ScenePortal() {
  const requested = useSceneHost((s) => s.requested);
  return requested ? <SceneMount /> : null;
}
