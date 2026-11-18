// Lo que la cinta observa del navegador: el tamaño de su lienzo y el pixel ratio, si está en pantalla
// (fuera de ella no se dibuja), los cambios de tema (alto contraste) y la carga de la tipografía.
import { cssVar } from '../../../lib/cssToken';

/**
 * Avisa cuando cambia el pixel ratio sin que cambie el tamaño CSS (al pasar la ventana a otra pantalla),
 * que el ResizeObserver no ve. La consulta vale para un ratio: tras cada cambio se rehace con el nuevo.
 */
function watchPixelRatio(onChange: () => void): () => void {
  let query: MediaQueryList | null = null;
  const changed = () => {
    arm();
    onChange();
  };
  const arm = () => {
    query?.removeEventListener('change', changed);
    query = typeof window.matchMedia === 'function' ? window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`) : null;
    query?.addEventListener('change', changed);
  };
  arm();
  return () => query?.removeEventListener('change', changed);
}

export interface Watchers {
  frame: HTMLElement;
  onResize(): void;
  onVisible(visible: boolean): void;
  /** Cambió la clase de <html> o llegó la tipografía: hay que repintar con los colores de ahora. */
  onTheme(): void;
}

/** Conecta los observadores y devuelve cómo desconectarlos todos. */
export function watchRibbon({ frame, onResize, onVisible, onTheme }: Watchers): () => void {
  let watching = true;
  const sizes = new ResizeObserver(onResize);
  const sight = new IntersectionObserver((entries) => onVisible(entries.at(-1)?.isIntersecting ?? false));
  const theme = new MutationObserver(onTheme);
  const unwatchRatio = watchPixelRatio(onResize);
  sizes.observe(frame);
  sight.observe(frame);
  theme.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  // Si la tipografía falla, las etiquetas quedan con la de respaldo: mejor eso que sin etiquetas.
  const font: Promise<unknown> = document.fonts ? document.fonts.load(`400 18px ${cssVar('--ff-body', 'serif')}`) : Promise.resolve();
  void font.catch(() => undefined).then(() => {
    if (watching) onTheme();
  });
  return () => {
    watching = false;
    unwatchRatio();
    [sizes, sight, theme].forEach((observer) => observer.disconnect());
  };
}
