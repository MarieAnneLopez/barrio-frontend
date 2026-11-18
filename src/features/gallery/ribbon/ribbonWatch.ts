// Lo que la cinta observa del navegador: el tamaño de su lienzo, si está en pantalla (fuera de ella no
// se dibuja), los cambios de tema (alto contraste) y la carga de la tipografía de las etiquetas.
import { cssVar } from '../../../lib/cssToken';

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
    [sizes, sight, theme].forEach((observer) => observer.disconnect());
  };
}
