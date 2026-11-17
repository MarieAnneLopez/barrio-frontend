// Lo que el reel observa del navegador: el tamaño de su lienzo, si el capítulo está en pantalla
// (fuera de ella no se dibuja), los cambios de tema y la carga de la tipografía de las portadas.

export interface Watchers {
  frame: HTMLElement;
  section: HTMLElement;
  onResize(): void;
  /** El capítulo entra o sale de pantalla. */
  onVisible(visible: boolean): void;
  /** Cambió la clase de <html> (alto contraste): los colores leídos de los tokens ya no valen. */
  onTheme(): void;
  /** La display está lista: ya se pueden pintar las portadas. */
  onFont(): void;
}

/** Las portadas se dibujan con Anton 400; `document.fonts.load` la espera (o resuelve ya si está). */
const DISPLAY_FONT = '400 64px Anton';

/** Conecta los observadores y devuelve cómo desconectarlos todos. */
export function watchReel({ frame, section, onResize, onVisible, onTheme, onFont }: Watchers): () => void {
  let watching = true;
  const sizes = new ResizeObserver(onResize);
  const sight = new IntersectionObserver((entries) => onVisible(entries.at(-1)?.isIntersecting ?? false));
  const theme = new MutationObserver(onTheme);
  sizes.observe(frame);
  sight.observe(section);
  theme.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

  // Si la tipografía falla, se pinta igual con la de respaldo: mejor eso que tarjetas vacías.
  const font: Promise<unknown> = document.fonts ? document.fonts.load(DISPLAY_FONT) : Promise.resolve();
  void font.catch(() => undefined).then(() => {
    if (watching) onFont();
  });

  return () => {
    watching = false;
    [sizes, sight, theme].forEach((observer) => observer.disconnect());
  };
}
