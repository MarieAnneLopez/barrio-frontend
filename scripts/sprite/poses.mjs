// Agrupa componentes en poses: las N mayores son semillas y las piezas
// sueltas (mechones, puños) se asignan a la semilla más cercana.

function boxDistance(a, b) {
  const dx = Math.max(0, a.minX - b.maxX, b.minX - a.maxX);
  const dy = Math.max(0, a.minY - b.maxY, b.minY - a.maxY);
  return Math.hypot(dx, dy);
}

function extend(pose, comp) {
  pose.ids.push(comp.id);
  pose.area += comp.area;
  pose.minX = Math.min(pose.minX, comp.minX);
  pose.maxX = Math.max(pose.maxX, comp.maxX);
  pose.minY = Math.min(pose.minY, comp.minY);
  pose.maxY = Math.max(pose.maxY, comp.maxY);
}

/**
 * @param {Array<{id:number, area:number, minX:number, maxX:number,
 *   minY:number, maxY:number}>} comps
 * @param {number} count número de poses esperadas
 * @param {{ minPieceArea?: number, maxPieceGap?: number }} [options]
 */
export function groupPoses(comps, count, options = {}) {
  const { minPieceArea = 50, maxPieceGap = 40 } = options;
  const bySize = [...comps].sort((a, b) => b.area - a.area);
  if (bySize.length < count) {
    throw new Error(`Se esperaban ${count} poses y solo hay ${bySize.length} componentes`);
  }
  const poses = bySize
    .slice(0, count)
    .sort((a, b) => a.minX - b.minX)
    .map((seed) => ({ ...seed, ids: [seed.id] }));

  for (const piece of bySize.slice(count)) {
    if (piece.area < minPieceArea) continue;
    const seeds = poses.map((pose) => ({ pose, gap: boxDistance(pose, piece) }));
    const nearest = seeds.sort((a, b) => a.gap - b.gap)[0];
    if (nearest && nearest.gap <= maxPieceGap) extend(nearest.pose, piece);
  }
  return poses;
}
