import { TNT3, type Suelo, type Vias } from '../data/format';
import { triangulate } from './groundAreas';
import { LEVEL } from './levels';
import { rightNormals } from './polyline';
import { footSpec, isCarClass, type FootSurface } from './roadClass';
import { pushRibbon, type DayNight, type Sink } from './sink';
import { wayLine } from './wayLine';

// Lo plano que va con el suelo en la misma malla: canales y quebradas, andenes, senderos y
// ciclorrutas de OSM (con su puente si lo tienen) y las plazas peatonales (vías con area=yes).

const A = TNT3.clasesAgua;
/** Medio ancho de las líneas de agua por clase (m, asumido: OSM no trae el ancho). */
const WATER_HALF: Record<number, number> = { [A.canal]: 3, [A.river]: 5, [A.stream]: 1.5, [A.drain]: 1.25, [A.ditch]: 0.75 };

export function pushWaterLines(sink: Sink, s: Suelo, color: DayNight): number {
  const before = sink.triangles;
  const l = s.lineas;
  for (let i = 0; i < l.count; i++) {
    const xz = l.xz.subarray(2 * (l.inicios[i] ?? 0), 2 * (l.inicios[i + 1] ?? 0));
    pushRibbon(sink, xz, rightNormals(xz), LEVEL.canal, WATER_HALF[l.clase[i] ?? 0] ?? 1.5, color);
  }
  return sink.triangles - before;
}

const B = TNT3.banderasVia;
const skip = (v: Vias, w: number) => ((v.banderas[w] ?? 0) & B.tunel) !== 0;

/** Andenes, senderos y ciclorrutas como cintas; las plazas (area=yes) como polígonos. */
export function pushFootways(sink: Sink, v: Vias, palette: Record<FootSurface, DayNight>): number {
  const before = sink.triangles;
  for (let w = 0; w < v.count; w++) {
    const clase = v.clase[w] ?? 0;
    const spec = footSpec(clase);
    if (skip(v, w) || (!spec && !isCarClass(clase))) continue;
    if ((v.banderas[w] ?? 0) & B.area) {
      pushPlaza(sink, v, w, palette.anden);
      continue;
    }
    if (!spec) continue;
    const line = wayLine(v, w);
    const y = line.y.map((h) => h + LEVEL.foot);
    pushRibbon(sink, line.xz, rightNormals(line.xz), y, spec.width / 2, palette[spec.surface]);
  }
  return sink.triangles - before;
}

function pushPlaza(sink: Sink, v: Vias, w: number, color: DayNight): void {
  const [a, b] = [v.tramos[w] ?? 0, v.tramos[w + 1] ?? 0];
  const closed = b - a > 1 && v.indices[a] === v.indices[b - 1];
  const ring: number[] = [];
  for (let i = a; i < (closed ? b - 1 : b); i++) {
    const n = v.indices[i] ?? 0;
    ring.push(v.nodos[2 * n] ?? 0, v.nodos[2 * n + 1] ?? 0);
  }
  const { xz, index } = triangulate([ring]);
  const first = sink.vertices;
  for (let i = 0; i < xz.length; i += 2) sink.vertex(xz[i] ?? 0, LEVEL.plaza, xz[i + 1] ?? 0, color);
  for (let t = 0; t < index.length; t += 3) sink.triangle(first + (index[t] ?? 0), first + (index[t + 1] ?? 0), first + (index[t + 2] ?? 0));
}
