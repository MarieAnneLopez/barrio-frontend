// Vuelo entre fotos (capítulo 2): convierte la posición del scroll nativo en la profundidad de la
// cámara y escribe los estilos por referencia. Sin easing ni autoplay: cada vez se recalcula todo,
// así el scroll hacia arriba revierte exacto. Un solo rAF, pedido solo cuando hace falta.
import { cameraZ, cardFrame, imageZ, progress } from './flightMath';

const round = (value: number, digits: number): number => Number(value.toFixed(digits));

/**
 * Pone en marcha el vuelo de `outer`, que contiene `[data-flight="sticky"]`, `[data-flight="space"]`
 * y las tarjetas `[data-flight="card"]`. Devuelve la limpieza.
 */
export function runFlight(outer: HTMLElement): () => void {
  const sticky = outer.querySelector<HTMLElement>('[data-flight="sticky"]');
  const space = outer.querySelector<HTMLElement>('[data-flight="space"]');
  const cards = [...outer.querySelectorAll<HTMLElement>('[data-flight="card"]')];
  if (!sticky || !space) return () => undefined;
  let frame = 0;
  let inView = typeof IntersectionObserver === 'undefined';

  const draw = () => {
    frame = 0;
    const travel = outer.offsetHeight - sticky.clientHeight;
    const camera = cameraZ(progress(outer.getBoundingClientRect().top, travel), cards.length);
    space.style.transform = `translate3d(0px, 0px, ${round(camera, 3)}px)`;
    cards.forEach((card, i) => {
      const { opacity, hidden } = cardFrame(i, camera);
      card.style.transform = `translate3d(0px, -50%, ${imageZ(i)}px)`;
      card.style.opacity = String(round(opacity, 4));
      card.style.visibility = hidden ? 'hidden' : 'visible';
    });
  };

  /** Como máximo un cuadro pendiente. */
  const request = () => {
    if (!frame) frame = requestAnimationFrame(draw);
  };
  /** Scroll, cambio de tamaño o vuelta a la pestaña: solo trabaja si la sección se ve. */
  const onChange = () => {
    if (inView && !document.hidden) request();
  };

  // Al entrar y al salir de pantalla, un cuadro deja el vuelo donde le toca.
  const observer = typeof IntersectionObserver === 'undefined' ? undefined : new IntersectionObserver((entries) => {
    inView = entries.at(-1)?.isIntersecting ?? inView;
    request();
  });
  observer?.observe(outer);
  const resize = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(onChange);
  resize?.observe(outer);
  window.addEventListener('scroll', onChange, { passive: true });
  window.addEventListener('resize', onChange);
  window.addEventListener('orientationchange', onChange);
  document.addEventListener('visibilitychange', onChange);
  draw(); // estado inicial, antes del primer pintado

  return () => {
    if (frame) cancelAnimationFrame(frame);
    observer?.disconnect();
    resize?.disconnect();
    window.removeEventListener('scroll', onChange);
    window.removeEventListener('resize', onChange);
    window.removeEventListener('orientationchange', onChange);
    document.removeEventListener('visibilitychange', onChange);
    for (const node of [space, ...cards]) node.style.transform = node.style.opacity = node.style.visibility = '';
  };
}
