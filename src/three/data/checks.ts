// Comprobaciones de coherencia al decodificar: un archivo cortado o mezclado falla con un
// mensaje claro en vez de dibujar basura.
import { FormatError } from './container';

/** Todas las columnas tienen una fila por elemento. */
export function sameLength(what: string, count: number, columns: Record<string, ArrayLike<number>>): void {
  for (const [name, column] of Object.entries(columns)) {
    if (column.length !== count) throw new FormatError(`${what}: ${name} tiene ${column.length} filas; se esperaban ${count}`);
  }
}

/** Inicios acumulados: n + 1 valores, empiezan en 0, no bajan y terminan en `total`. */
export function startsCover(what: string, begins: ArrayLike<number>, total: number): void {
  let ok = begins.length > 0 && begins[0] === 0 && begins[begins.length - 1] === total;
  for (let i = 1; ok && i < begins.length; i++) ok = (begins[i] ?? 0) >= (begins[i - 1] ?? 0);
  if (!ok) throw new FormatError(`${what}: los inicios no cubren los ${total} elementos`);
}

/** Cada índice apunta dentro de su tabla. */
export function withinTable(what: string, indices: ArrayLike<number>, size: number): void {
  for (let i = 0; i < indices.length; i++) {
    if ((indices[i] ?? 0) >= size) throw new FormatError(`${what}: índice ${indices[i]} fuera de la tabla (${size})`);
  }
}
