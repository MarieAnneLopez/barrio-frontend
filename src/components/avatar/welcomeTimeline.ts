// Coreografía de la bienvenida (§11.4.3, H33) con GSAP. Principal: el letrero "Hola";
// apoyo: las Mini Marie que se asoman desde los bordes y el botón; decoración: confeti.
// Solo transform y opacity.
import gsap from 'gsap';
import { peekStart, type PeekEdge } from './welcomeGeometry';

/** Desfases cortos y distintos: llegan casi juntas, sin sonar a metrónomo. */
const PEEK_OFFSETS = [0, 0.07, 0.12];

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
  q('.welcome-peek__body').forEach((element, i) => {
    const start = peekStart((element.dataset.edge ?? 'left') as PeekEdge);
    tl.fromTo(
      element,
      { ...start, opacity: 0 },
      { xPercent: 0, yPercent: 0, opacity: 1, duration: 0.7, ease: 'back.out(1.4)' },
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
