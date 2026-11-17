import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Vitest va con css: false: las hojas se leen como texto y se comprueban los números de la
// especificación (docs/superpowers/specs, §6, cap. 2).
const here = dirname(fileURLToPath(import.meta.url));
const css = ['flight.css', 'flight-reduced.css']
  .map((name) => readFileSync(join(here, name), 'utf8'))
  .join('\n')
  .replace(/\/\*[\s\S]*?\*\//g, '');
const literal = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Declaraciones de la regla con ese selector exacto, en toda la hoja o dentro de un bloque. */
const rule = (selector: string, source = css) =>
  new RegExp(`(?:^|\\})\\s*${literal(selector)} \\{([^}]*)\\}`).exec(source)?.[1] ?? '';
const system = /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?\})\s*\}/.exec(css)?.[1] ?? '';
const ASKED = ':is(.flight[data-reduced], :root.reduce-motion .flight)'; // el componente o la barra de accesibilidad
const ALLOWED = /^(bg-primary|bg-accent|text-primary|text-on-accent|text-highlight|border-(ink|subtle|strong)|r-sm)$/;
const has = (body: string, ...declarations: string[]) => declarations.forEach((text) => expect(body).toContain(text));

describe('hoja del vuelo entre fotos: medidas de la especificación', () => {
  it('la sección mide N + 1 pantallas y no recorta (el sticky necesita ancestros sin overflow)', () => {
    has(rule('.flight'), 'position: relative;', 'height: calc((var(--flight-n) + 1) * 100svh);');
    expect(rule('.flight')).not.toMatch(/overflow|contain/);
  });

  it('el recuadro sticky ocupa una pantalla, pegado arriba, y recorta lo que sale', () => {
    has(rule('.flight__sticky'), 'position: sticky;', 'top: 0;', 'height: 100svh;', 'overflow: hidden;');
  });

  it('cámara a todo el recuadro con perspectiva de 30 px y origen al centro', () => {
    has(rule('.flight__camera'), 'position: absolute;', 'inset: 0;', 'perspective: 30px;', 'perspective-origin: 50% 50%;');
  });

  it('el espacio de imágenes ocupa el 90 % central en 3D, sin nada que lo aplane', () => {
    const space = rule('.flight__space');
    has(space, 'left: 5%;', 'width: 90%;', 'height: 100%;', 'transform-style: preserve-3d;');
    expect(space).not.toMatch(/opacity|filter|clip|overflow|mask|will-change/);
  });

  it('tarjetas al 45 %, centradas en vertical, pares a la izquierda e impares a la derecha', () => {
    has(rule('.flight__card'), 'position: absolute;', 'top: 50%;', 'width: 45%;', 'aspect-ratio: var(--flight-ratio);', 'backface-visibility: hidden;');
    has(rule(".flight__card[data-side='left']"), 'left: 0;');
    has(rule(".flight__card[data-side='right']"), 'right: 0;');
  });

  it('las fotos cubren su tarjeta con radio de 4 px y sin sombra; el fondo va oscurecido a 0,62', () => {
    has(rule('.flight__photo'), 'object-fit: cover;', 'border-radius: var(--r-sm);');
    has(rule('.flight__backdrop'), 'inset: 0;', 'object-fit: cover;', 'filter: brightness(0.62);');
    expect(css).not.toMatch(/box-shadow/);
  });

  it('ninguna foto se enseña hasta estar decodificada', () => {
    has(rule('.flight img:not([data-ready])'), 'visibility: hidden;');
  });
});

describe('hoja del vuelo entre fotos: movimiento reducido', () => {
  it.each([
    ['el componente o la barra de accesibilidad lo piden', (part: string) => rule(`${ASKED}${part}`)],
    ['lo pide el sistema (respaldo sin script)', (part: string) => rule(`.flight${part}`, system)],
  ])('si %s: sin recorrido, sin sticky, sin perspectiva y en rejilla de 2 × 2', (_who, find) => {
    has(find(''), 'height: auto;');
    has(find(' .flight__sticky'), 'position: relative;');
    has(find(' .flight__camera'), 'perspective: none;');
    has(find(' .flight__space'), 'display: grid;', 'grid-template-columns: repeat(2, minmax(0, 1fr));', 'transform: none !important;');
    // Los estilos en línea del vuelo no pueden ganarle a la rejilla.
    has(find(' .flight__card'), 'transform: none !important;', 'opacity: 1 !important;', 'visibility: visible !important;');
  });
});

describe('hoja del vuelo entre fotos: sistema de diseño', () => {
  it('solo tokens semánticos: sin colores fijos, transiciones ni animaciones CSS', () => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b|\b(rgb|hsl)a?\(|var\(--(c|palette)-/i);
    expect(css).not.toMatch(/transition|animation|@keyframes/);
    const borrowed = [...css.matchAll(/var\(--([\w-]+)/g)].map((match) => match[1] ?? '').filter((name) => !name.startsWith('flight-'));
    expect(borrowed).toContain('bg-primary');
    expect(borrowed.filter((name) => !ALLOWED.test(name))).toEqual([]);
  });
});
