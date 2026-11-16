// Coreografía de la bienvenida (§11.4.3, H33, D82) con GSAP. Principal: el letrero "Hola";
// apoyo: las 8 Mini Marie que salen desde fuera de la pantalla y el botón; decoración: confeti.
// Solo transform y opacity.
import gsap from 'gsap';

/** Desfases cortos y distintos: llegan casi juntas, sin sonar a metrónomo. */
const PEEK_OFFSETS = [0, 0.06, 0.03, 0.09, 0.05, 0.11, 0.02, 0.08];
/** Fuera de la pantalla: se corre hacia afuera su parte visible (46 %) y un poco más. */
const OUTSIDE = 50;

export interface WelcomeGeometry {
  confettiTargets: readonly { x: number; y: number }[];
}

export function playWelcome(root: HTMLElement, geometry: WelcomeGeometry, reduced: boolean) {
  const q = gsap.utils.selector(root);
  const tl = gsap.timeline();
  if (reduced) {
    // Movimiento reducido: todo aparece junto, solo con opacidad; las poses quedan fijas.
    tl.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power1.out' });
    tl.set(q('.welcome-confetti'), { opacity: 0 }, 0);
    return tl;
  }
  tl.fromTo(q('.welcome-backdrop'), { opacity: 0 }, { opacity: 1, duration: 0.24, ease: 'power2.out' }, 0);
  // Cada una gira con su ranura: «abajo» en su propio eje es siempre hacia afuera del borde.
  q('.welcome-peek__body').forEach((element, i) => {
    tl.fromTo(
      element,
      { xPercent: -50, yPercent: OUTSIDE },
      { xPercent: -50, yPercent: 0, duration: 0.7, ease: 'back.out(1.4)' },
      PEEK_OFFSETS[i] ?? 0,
    );
  });
  tl.fromTo(
    q('.welcome-letter'),
    { opacity: 0, scale: 0.6 },
    { opacity: 1, scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.55)', stagger: 0.08 },
    0.12,
  );
  tl.fromTo(q('.welcome-cta'), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, 0.45);
  // Confeti: estalla cuando aterriza el letrero y se desvanece.
  q('.welcome-confetti').forEach((element, i) => {
    const target = geometry.confettiTargets[i] ?? { x: 0, y: 0 };
    tl.fromTo(
      element,
      { opacity: 0, x: 0, y: 0, scale: 0.6 },
      { opacity: 1, x: target.x, y: target.y, scale: 1, duration: 0.9, ease: 'power3.out' },
      0.65,
    );
  });
  tl.to(q('.welcome-confetti'), { opacity: 0, duration: 0.5, ease: 'power1.out' }, 1.25);
  return tl;
}

/** Salida: todo junto, más corta que la entrada (200 ms). */
export function exitWelcome(root: HTMLElement, onDone: () => void) {
  return gsap.to(root, { opacity: 0, duration: 0.2, ease: 'power2.out', onComplete: onDone });
}
