// Escáner de mensajes de estado (PAL-06): el color de un estado nunca va solo, lleva ícono y texto.
// Lee el JSX sin parser: cada etiqueta de apertura (atributos entre comillas o entre llaves, hasta
// tres niveles) y hasta dónde llega su contenido (la etiqueta de cierre que le corresponde).
const STATE = /\b(?:text|border|bg)-(?:error|warning|success)\b|role="alert"/;
const LIVE = /\baria-live=|role="status"/;
const ATTRS = String.raw`((?:[^>"'{}]|"[^"]*"|'[^']*'|\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\})*)`;
const OPEN = new RegExp(String.raw`<([A-Za-z][\w.]*)${ATTRS}>`, 'g');

interface JsxElement {
  tag: string;
  attrs: string;
  start: number;
  /** Fin de la etiqueta de cierre (o de la propia apertura, si se cierra sola). */
  end: number;
}

const selfClosing = (attrs: string) => attrs.trimEnd().endsWith('/');

/** Dónde se cierra la etiqueta `tag` abierta justo antes de `from`, contando las anidadas del mismo nombre. */
function closeOf(source: string, tag: string, from: number): number {
  const name = tag.replace(/\./g, '\\.');
  const marks = new RegExp(`<${name}(?=[\\s>/])|</${name}\\s*>`, 'g');
  const at = new RegExp(OPEN.source, 'y');
  marks.lastIndex = from;
  let depth = 1;
  for (let mark = marks.exec(source); mark; mark = marks.exec(source)) {
    if (mark[0].startsWith('</')) {
      depth -= 1;
      if (depth === 0) return mark.index + mark[0].length;
      continue;
    }
    at.lastIndex = mark.index;
    if (!selfClosing(at.exec(source)?.[2] ?? '/')) depth += 1;
  }
  return source.length;
}

function jsxElements(source: string): JsxElement[] {
  return [...source.matchAll(OPEN)].map((match) => {
    const [whole, tag = '', attrs = ''] = match;
    const start = match.index;
    const end = selfClosing(attrs) ? start + whole.length : closeOf(source, tag, start + whole.length);
    return { tag, attrs, start, end };
  });
}

const lineOf = (source: string, at: number) => source.slice(0, at).split('\n').length;
const hasIcon = (source: string, element: JsxElement) => source.slice(element.start, element.end).includes('<StateIcon');

/**
 * Huecos de un archivo .tsx: cada mensaje de estado (color de estado o role="alert") lleva su propio
 * ícono, y lo que va dentro de un mensaje es parte de él; las regiones vivas sin ícono no pasan de las
 * `neutralLive` que el archivo declara neutras (contadores, carruseles, cargas: no anuncian estados).
 */
export function stateGaps(source: string, neutralLive = 0): string[] {
  const elements = jsxElements(source);
  const state = elements.filter((element) => STATE.test(element.attrs));
  const inside = (element: JsxElement) =>
    state.some((outer) => outer !== element && outer.start < element.start && element.start < outer.end);
  const gaps = state
    .filter((element) => !inside(element) && !hasIcon(source, element))
    .map((element) => `<${element.tag}> de la línea ${lineOf(source, element.start)}: estado sin ícono`);
  const silent = elements.filter((element) => LIVE.test(element.attrs) && !STATE.test(element.attrs) && !hasIcon(source, element));
  if (silent.length > neutralLive) {
    const lines = silent.map((element) => lineOf(source, element.start)).join(', ');
    gaps.push(`${silent.length} regiones vivas sin ícono (líneas ${lines}) y solo ${neutralLive} declaradas neutras`);
  }
  return gaps;
}
