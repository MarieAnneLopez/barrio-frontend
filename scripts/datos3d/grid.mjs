// Índice espacial por celdas cuadradas (metros): cada elemento se guarda en las celdas que toca su
// caja [minX, minZ, maxX, maxZ]; una consulta devuelve los candidatos sin repetir.
export function createGrid(cellSize) {
  const cells = new Map();
  const range = (min, max) => [Math.floor(min / cellSize), Math.floor(max / cellSize)];
  const each = ([x0, z0, x1, z1], visit) => {
    const [cx0, cx1] = range(x0, x1);
    const [cz0, cz1] = range(z0, z1);
    for (let cx = cx0; cx <= cx1; cx++) for (let cz = cz0; cz <= cz1; cz++) visit(`${cx},${cz}`);
  };
  return {
    insert(id, box) {
      each(box, (key) => {
        const list = cells.get(key);
        if (list) list.push(id);
        else cells.set(key, [id]);
      });
    },
    query(box) {
      const found = new Set();
      each(box, (key) => cells.get(key)?.forEach((id) => found.add(id)));
      return [...found];
    },
    around([x, z], radius) {
      return this.query([x - radius, z - radius, x + radius, z + radius]);
    },
  };
}
