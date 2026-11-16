// Aspecto del header según lo que tiene debajo (etapa 2). Las secciones a pantalla completa se
// registran aquí y declaran con atributos cómo debe verse el header mientras pasa sobre ellas:
// data-tone="noche|papel" y, si debe ser transparente, data-header-float. Un IntersectionObserver
// reducido a la línea media del header avisa cuando una sección la cruza: no hay oyente de scroll.
export type Tone = 'noche' | 'papel';

export interface HeaderLook {
  tone: Tone;
  float: boolean;
}

interface Band {
  top: number;
  bottom: number;
  tone?: string | undefined;
  float: boolean;
}

/** Sin sección marcada debajo: fondo sólido y texto claro. */
export const DEFAULT_LOOK: HeaderLook = { tone: 'noche', float: false };
/** Línea media del header, que mide 64 px de alto. */
export const HEADER_LINE = 32;

/** Manda la sección que cruza la línea media del header. */
export function pickLook(bands: readonly Band[], line = HEADER_LINE): HeaderLook {
  const hit = bands.find((band) => band.top <= line && band.bottom > line);
  return hit ? { tone: hit.tone === 'papel' ? 'papel' : 'noche', float: hit.float } : DEFAULT_LOOK;
}

const sections = new Set<HTMLElement>();
const listeners = new Set<() => void>();
let look = DEFAULT_LOOK;
let observer: IntersectionObserver | undefined;

function band(element: HTMLElement): Band {
  const { top, bottom } = element.getBoundingClientRect();
  return { top, bottom, tone: element.dataset.tone, float: element.dataset.headerFloat !== undefined };
}

/** Vuelve a leer el aspecto; úsalo si una sección cambia su data-tone (p. ej. al acabar una animación). */
export function refreshTone(): void {
  const next = pickLook([...sections].map(band));
  if (next.tone === look.tone && next.float === look.float) return;
  look = next;
  listeners.forEach((listener) => listener());
}

function watch(): void {
  observer?.disconnect();
  observer = undefined;
  if (typeof IntersectionObserver !== 'undefined' && sections.size > 0) {
    const below = Math.max(0, window.innerHeight - HEADER_LINE - 1);
    observer = new IntersectionObserver(refreshTone, { rootMargin: `-${HEADER_LINE}px 0px -${below}px 0px` });
    sections.forEach((element) => observer?.observe(element));
  }
  refreshTone();
}

/** Registra una sección con tono; devuelve cómo retirarla. */
export function registerTone(element: HTMLElement): () => void {
  sections.add(element);
  watch();
  return () => {
    sections.delete(element);
    watch();
  };
}

export function subscribeLook(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener('resize', watch);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener('resize', watch);
  };
}

export const currentLook = (): HeaderLook => look;
