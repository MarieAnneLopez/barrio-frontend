// Figuras que se eligen en el suelo (revisión del carril mapas): en la sección de Datos Catastrales
// (3 706 lotes) o de Estado de Calles (341 tramos), un marcador por figura era una alfombra que tapaba
// el mapa y volvía ambiguo el clic. Allí cada figura se elige donde está: el lote que contiene el
// punto del suelo bajo el puntero, o el tramo más cercano. Funciones puras (x al este, z al sur).

export interface PlaceShapes {
  /** Id en la API de cada figura. */
  ids: number[];
  /** 1 si la figura es un área (se elige por dentro); 0 si es un trazo (se elige por cercanía). */
  closed: Uint8Array;
  /** Centro de cada figura (xyz): el marcador de la elegida y el vuelo de la cámara. */
  centers: Float32Array;
  /** Figura de cada segmento del contorno de la capa (PlaceLayer.outline), en el mismo orden. */
  owner: Uint32Array;
}

/** Junta las figuras mientras se arma el contorno de la capa: `segments` es lo que cada una le sumó. */
export function shapeCollector() {
  const ids: number[] = [];
  const closed: number[] = [];
  const centers: number[] = [];
  const owner: number[] = [];
  return {
    add(id: number, area: boolean, center: readonly [number, number, number], segments: number): void {
      for (let i = 0; i < segments; i++) owner.push(ids.length);
      ids.push(id);
      closed.push(area ? 1 : 0);
      centers.push(...center);
    },
    done: (): PlaceShapes => ({
      ids, closed: Uint8Array.from(closed), centers: Float32Array.from(centers), owner: Uint32Array.from(owner),
    }),
  };
}

/** Distancia al cuadrado del punto (x, z) al segmento (x0, z0)–(x1, z1). */
function toSegment(x: number, z: number, x0: number, z0: number, x1: number, z1: number): number {
  const [dx, dz] = [x1 - x0, z1 - z0];
  const length = dx * dx + dz * dz;
  const t = length > 0 ? Math.min(1, Math.max(0, ((x - x0) * dx + (z - z0) * dz) / length)) : 0;
  return (x0 + t * dx - x) ** 2 + (z0 + t * dz - z) ** 2;
}

/**
 * Figura bajo el punto (x, z) del suelo: el área que lo contiene (regla par-impar sobre sus
 * segmentos, así el hueco de un lote no es del lote) o, si ninguna, el trazo más cercano a menos de
 * `tolerance` metros. -1 si no hay ninguna.
 */
export function shapeAt(shapes: PlaceShapes, outline: ArrayLike<number>, x: number, z: number, tolerance: number): number {
  const inside = new Uint8Array(shapes.ids.length);
  let near = -1;
  let nearest = tolerance * tolerance;
  for (let s = 0; s < shapes.owner.length; s++) {
    const shape = shapes.owner[s] ?? 0;
    const [x0, z0, x1, z1] = [outline[s * 6] ?? 0, outline[s * 6 + 2] ?? 0, outline[s * 6 + 3] ?? 0, outline[s * 6 + 5] ?? 0];
    if (shapes.closed[shape]) {
      if (z0 > z !== z1 > z && x < x0 + ((z - z0) * (x1 - x0)) / (z1 - z0)) inside[shape] = 1 - (inside[shape] ?? 0);
      continue;
    }
    const distance = toSegment(x, z, x0, z0, x1, z1);
    if (distance <= nearest) [near, nearest] = [shape, distance];
  }
  const found = inside.indexOf(1);
  return found >= 0 ? found : near;
}

/** Segmentos (pares de extremos xyz) de una sola figura, para su resalte. */
export function shapeOutline(shapes: PlaceShapes, outline: Float32Array, index: number): Float32Array {
  const own: number[] = [];
  for (let s = 0; s < shapes.owner.length; s++) {
    if (shapes.owner[s] === index) own.push(...outline.subarray(s * 6, s * 6 + 6));
  }
  return new Float32Array(own);
}
