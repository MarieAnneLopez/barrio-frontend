// Etiquetado de componentes conectados (conectividad 4) sobre una máscara.

/**
 * @param {Uint8Array} mask 1 = primer plano
 * @returns {{ labels: Int32Array, comps: Array<{id:number, area:number,
 *   minX:number, maxX:number, minY:number, maxY:number}> }}
 */
export function labelComponents(mask, width, height) {
  const labels = new Int32Array(width * height);
  const comps = [];
  const stack = new Int32Array(width * height);
  let next = 0;

  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || labels[start]) continue;
    next += 1;
    const comp = { id: next, area: 0, minX: width, maxX: -1, minY: height, maxY: -1 };
    let top = 0;
    stack[top++] = start;
    labels[start] = next;

    while (top > 0) {
      const p = stack[--top];
      const x = p % width;
      const y = (p - x) / width;
      comp.area += 1;
      if (x < comp.minX) comp.minX = x;
      if (x > comp.maxX) comp.maxX = x;
      if (y < comp.minY) comp.minY = y;
      if (y > comp.maxY) comp.maxY = y;
      const neighbors = [
        x > 0 ? p - 1 : -1,
        x < width - 1 ? p + 1 : -1,
        y > 0 ? p - width : -1,
        y < height - 1 ? p + width : -1,
      ];
      for (const n of neighbors) {
        if (n >= 0 && mask[n] && !labels[n]) {
          labels[n] = next;
          stack[top++] = n;
        }
      }
    }
    comps.push(comp);
  }
  return { labels, comps };
}
