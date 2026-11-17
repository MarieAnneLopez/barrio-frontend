// Ayuda de pruebas: lee las hojas de estilo de esta carpeta como texto (Vitest va con css: false).
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const literal = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Lee las hojas (sin comentarios) y da buscadores de reglas por selector exacto y de bloques @media. */
export function readSheets(...names: string[]) {
  const css = names
    .map((name) => readFileSync(join(here, name), 'utf8'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  /** Declaraciones de la regla con ese selector exacto, en toda la hoja o dentro de `source`. */
  const rule = (selector: string, source = css) =>
    new RegExp(`(?:^|\\})\\s*${literal(selector)} \\{([^}]*)\\}`).exec(source)?.[1] ?? '';
  /** Contenido del bloque `@media (query)`. */
  const media = (query: string) =>
    new RegExp(`@media \\(${literal(query)}\\) \\{([\\s\\S]*?\\})\\s*\\}`).exec(css)?.[1] ?? '';
  return { css, rule, media };
}
