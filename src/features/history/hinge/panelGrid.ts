import { BoxGeometry, Group, Mesh, MeshBasicMaterial, type Texture } from 'three';
import { HINGE_COLS, HINGE_ROWS, hingePanelState } from './hingeMath';

function panelGeometry(col: number, row: number) {
  const geometry = new BoxGeometry(1, 1, 0.08);
  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < position.count; i++) {
    const face = normal.getZ(i);
    if (!face) continue;
    // -Z invierte la U local: después de media vuelta ambas caras se leen de izquierda a derecha.
    const u = 0.5 + face * position.getX(i);
    uv.setXY(i, (col + u) / HINGE_COLS, 1 - (row + 0.5 - position.getY(i)) / HINGE_ROWS);
  }
  geometry.clearGroups();
  geometry.addGroup(0, 24, 0); // cuatro cantos
  geometry.addGroup(24, 6, 1);
  geometry.addGroup(30, 6, 2);
  return geometry;
}

export function createPanelGrid() {
  const group = new Group();
  const edge = new MeshBasicMaterial();
  const front = new MeshBasicMaterial();
  const back = new MeshBasicMaterial();
  const materials = [edge, front, back];
  const litFront = front.clone();
  const litBack = back.clone();
  litFront.color.setScalar(0.92);
  litBack.color.setScalar(0.92);
  const highlight = [edge, litFront, litBack];
  const panels = Array.from({ length: HINGE_COLS * HINGE_ROWS }, (_, index) => {
    const geometry = panelGeometry(index % HINGE_COLS, Math.floor(index / HINGE_COLS));
    const mesh = new Mesh(geometry, materials);
    group.add(mesh);
    return mesh;
  });

  function setMap(material: MeshBasicMaterial, texture: Texture | undefined) {
    const map = texture ?? null;
    if (Boolean(material.map) !== Boolean(map)) material.needsUpdate = true;
    material.map = map;
    material.visible = Boolean(map);
  }

  return {
    group, panels, edge,
    pose(progress: number, texture: (index: number) => Texture | undefined) {
      const index = Math.floor(progress);
      setMap(front, texture(index));
      setMap(back, texture(index + 1));
      setMap(litFront, texture(index));
      setMap(litBack, texture(index + 1));
      for (const [i, panel] of panels.entries()) {
        const col = i % HINGE_COLS;
        const row = Math.floor(i / HINGE_COLS);
        const { rotX, rotY, posZ, outward } = hingePanelState(progress - index, col, row);
        panel.rotation.set(rotX, rotY, 0);
        panel.position.set((col - 1.5) * (1 + outward), (1 - row) * (1 + outward), posZ);
      }
    },
    hover(selected: Mesh | undefined) {
      for (const panel of panels) panel.material = panel === selected ? highlight : materials;
    },
    dispose() {
      panels.forEach(panel => panel.geometry.dispose());
      new Set([...materials, ...highlight]).forEach(material => material.dispose());
    },
  };
}
