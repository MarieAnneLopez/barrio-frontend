// Longitud CSS en px reales, para medir tamaños de letra (PAL-04): la raíz mide 16 px × --font-scale
// (barra de accesibilidad: 90 %, 100 %, 112,5 % y 125 %) y vw, svh y cqw salen de la ventana.
// Resuelve var() con un mapa y evalúa números con rem, px, vw, svh y cqw, + - * /, paréntesis,
// calc(), min(), max() y clamp(). Lo que no entiende lanza un error, para que la prueba lo vea.
export interface LengthContext {
  /** px de 1rem. */
  rem: number;
  /** Ancho y alto de la ventana en px; el contenedor (cqw) mide lo que la ventana si no se da. */
  width: number;
  height?: number;
  container?: number;
  vars?: Map<string, string>;
}

const TOKEN = /\d*\.?\d+(?:rem|px|vw|svh|cqw)?|[a-z]+\(|[()+\-*/,]/g;

export function cssPx(expression: string, ctx: LengthContext): number {
  let text = expression;
  for (let depth = 0; text.includes('var(') && depth < 20; depth += 1) {
    text = text.replace(/var\((--[\w-]+)\)/g, (_, name: string) => {
      const value = ctx.vars?.get(name);
      if (value === undefined) throw new Error(`Variable sin valor: ${name}`);
      return `(${value})`;
    });
  }
  const tokens = text.match(TOKEN) ?? [];
  if (tokens.join('') !== text.replace(/\s+/g, '')) throw new Error(`Longitud no soportada: ${expression}`);
  let at = 0;
  const peek = () => tokens[at];
  const take = (expected?: string) => {
    const token = tokens[at++];
    if (token === undefined || (expected !== undefined && token !== expected)) {
      throw new Error(`Se esperaba «${expected ?? 'algo'}» en: ${expression}`);
    }
    return token;
  };
  const unit: Record<string, number> = {
    rem: ctx.rem, px: 1, vw: ctx.width / 100, svh: (ctx.height ?? 0) / 100, cqw: (ctx.container ?? ctx.width) / 100,
  };
  const FN: Record<string, (args: number[]) => number> = {
    'calc(': ([a = NaN]) => a,
    'min(': (args) => Math.min(...args),
    'max(': (args) => Math.max(...args),
    'clamp(': ([lo = NaN, value = NaN, hi = NaN]) => Math.max(lo, Math.min(value, hi)),
  };
  function factor(): number {
    const token = take();
    if (token === '(') {
      const value = sum();
      take(')');
      return value;
    }
    const fn = FN[token];
    if (fn) {
      const args = [sum()];
      while (peek() === ',') {
        take(',');
        args.push(sum());
      }
      take(')');
      return fn(args);
    }
    const [, number = '', suffix = ''] = /^(\d*\.?\d+)([a-z]*)$/.exec(token) ?? [];
    if (!number) throw new Error(`Token inesperado «${token}» en: ${expression}`);
    return Number(number) * (suffix ? (unit[suffix] ?? NaN) : 1);
  }
  function product(): number {
    let value = factor();
    while (peek() === '*' || peek() === '/') value = take() === '*' ? value * factor() : value / factor();
    return value;
  }
  function sum(): number {
    let value = product();
    while (peek() === '+' || peek() === '-') value = take() === '+' ? value + product() : value - product();
    return value;
  }
  const result = sum();
  if (at !== tokens.length) throw new Error(`Sobra texto en: ${expression}`);
  return result;
}
