import { lazy, Suspense, useEffect } from 'react';
import { useWelcomeStore } from '../../store/welcomeStore';

// Rendimiento (gran actualización): la bienvenida, con GSAP que la anima, baja en su propio chunk
// solo cuando se va a mostrar (primera visita de la sesión o «Repetir bienvenida»). Mientras la
// pantalla de carga sigue arriba hay tiempo de sobra para traerla.
const WelcomeChoreography = lazy(() =>
  import('./WelcomeChoreography').then((m) => ({ default: m.WelcomeChoreography })),
);

export function WelcomeGate() {
  const requested = useWelcomeStore((s) => s.open);
  const openIfFirstVisit = useWelcomeStore((s) => s.openIfFirstVisit);
  useEffect(() => openIfFirstVisit(), [openIfFirstVisit]);
  if (!requested) return null;
  return (
    <Suspense fallback={null}>
      <WelcomeChoreography />
    </Suspense>
  );
}
