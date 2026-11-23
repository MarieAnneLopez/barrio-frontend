import { BoxGeometry, Group, Mesh, MeshBasicMaterial, type Texture } from 'three';
import { HINGE_COLS, HINGE_ROWS, hingePanelState } from './hingeMath';

/** Grosor de cada pieza en altos de pieza: se ve de canto mientras gira. */
export const PANEL_DEPTH = 0.06;

function panelGeometry(col: number, row: number) {
  const geometry = new BoxGeometry(1, 1, PANEL_DEPTH);
  const position = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  // Cada pieza muestra su doceavo de la cubierta: juntas forman la superficie completa.
  for (let i = 0; i < position.count; i++) {
    uv.setXY(i, (col + 0.5 + position.getX(i)) / HINGE_COLS, 1 - (row + 0.5 - position.getY(i)) / HINGE_ROWS);
  }
  geometry.clearGroups();
  geometry.addGroup(0, 24, 0); // cuatro cantos
  geometry.addGroup(24, 6, 1); // cara frontal: la cubierta
  geometry.addGroup(30, 6, 2); // cara trasera: transparente, deja ver la tarjeta real
  return geometry;
}

/** Superficie de 4 × 3 piezas; materiales y textura compartidos entre las doce. */
export function createPanelGrid() {
  const group = new Group();
  const edge = new MeshBasicMaterial();
  const front = new MeshBasicMaterial({ visible: false });
  const back = new MeshBasicMaterial({ visible: false });
  const materials = [edge, front, back];
  const panels = Array.from({ length: HINGE_COLS * HINGE_ROWS }, (_, index) => {
    const mesh = new Mesh(panelGeometry(index % HINGE_COLS, Math.floor(index / HINGE_COLS)), materials);
    group.add(mesh);
    return mesh;
  });

  return {
    group,
    edge,
    setCover(texture: Texture) {
      if (!front.map) front.needsUpdate = true;
      front.map = texture;
      front.visible = true;
    },
    /** fraccion 0 = cubierta plana; 1 = todas las piezas de espaldas (la tarjeta se ve entera). */
    pose(fraccion: number, panelWidth: number) {
      for (const [i, panel] of panels.entries()) {
        const col = i % HINGE_COLS;
        const row = Math.floor(i / HINGE_COLS);
        const { rotX, rotY, posZ, outward } = hingePanelState(fraccion, col, row);
        // Una pieza que terminó su media vuelta solo mostraría sus cantos sobre el texto: se oculta.
        panel.visible = rotY < Math.PI - 1e-4;
        panel.scale.set(panelWidth, 1, 1);
        panel.rotation.set(rotX, rotY, 0);
        panel.position.set((col - 1.5) * panelWidth * (1 + outward), (1 - row) * (1 + outward), posZ);
      }
    },
    dispose() {
      panels.forEach((panel) => panel.geometry.dispose());
      materials.forEach((material) => material.dispose());
    },
  };
}
