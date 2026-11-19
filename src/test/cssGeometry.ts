// Longitudes CSS para las pruebas de geometría: jsdom no maqueta, así que la cuenta la hace la prueba
// con los valores de la hoja. Entiende px, rem, %, vw, vh, vmin y números sueltos; calc(), min(),
// max(), clamp() y var(--x[, respaldo]); + y - entre espacios, * y /, como pide CSS.

export interface LengthContext {
  vw: number;
  vh: number;
  rem: number;
  /** A qué equivale 100 % (el alto o el ancho del bloque contenedor, según la propiedad). */
  percent: number;
  vars: Record<string, string>;
}

/** Sustituye cada var(--x[, respaldo]) por su valor entre paréntesis, hasta que no quede ninguna. */
function substitute(expr: string, vars: Record<string, string>): string {
  const next = expr.replace(/var\((--[\w-]+)(?:,\s*([^()]*))?\)/g, (_all, name: string, fallback?: string) => {
    const value = vars[name] ?? fallback;
    if (value === undefined) throw new Error(`Variable sin valor: ${name}`);
    return `(${value})`;
  });
  return next === expr ? next : substitute(next, vars);
}

function unit(token: string, ctx: LengthContext): number {
  const [, digits = '', suffix = ''] = /^(-?\d*\.?\d+)(px|rem|%|vw|vh|vmin)?$/.exec(token) ?? [];
  if (!digits) throw new Error(`No es una longitud: ${token}`);
  const n = Number(digits);
  const scale: Record<string, number> = {
    '': 1, px: 1, rem: ctx.rem, '%': ctx.percent / 100, vw: ctx.vw / 100, vh: ctx.vh / 100, vmin: Math.min(ctx.vw, ctx.vh) / 100,
  };
  return n * (scale[suffix] ?? Number.NaN);
}

/** Valor en px de una expresión CSS de longitud en ese contexto. */
export function cssLength(expr: string, ctx: LengthContext): number {
  const tokens = substitute(expr, ctx.vars).replace(/([(),*/])/g, ' $1 ').trim().split(/\s+/);
  let at = 0;
  const peek = () => tokens[at];
  const take = () => tokens[at++] ?? '';
  const call = (name: string, args: number[]): number => {
    if (name === 'calc') return args[0] ?? Number.NaN;
    if (name === 'min') return Math.min(...args);
    if (name === 'max') return Math.max(...args);
    if (name === 'clamp') return Math.min(Math.max(args[0] ?? 0, args[1] ?? 0), args[2] ?? 0);
    throw new Error(`Función CSS no soportada: ${name}`);
  };
  function atom(): number {
    const token = take();
    if (token === '(') {
      const value = sum();
      take();
      return value;
    }
    if (/^[a-z]+$/.test(token) && peek() === '(') {
      take();
      const args = [sum()];
      while (peek() === ',') {
        take();
        args.push(sum());
      }
      take();
      return call(token, args);
    }
    return unit(token, ctx);
  }
  function product(): number {
    let value = atom();
    while (peek() === '*' || peek() === '/') value = take() === '*' ? value * atom() : value / atom();
    return value;
  }
  function sum(): number {
    let value = product();
    while (peek() === '+' || peek() === '-') value = take() === '+' ? value + product() : value - product();
    return value;
  }
  const result = sum();
  if (at !== tokens.length) throw new Error(`Sobra algo en: ${expr}`);
  return result;
}
