// Escena de la cinta con three directo: la cámara, el suelo y las ranuras. No sabe del renderer ni
// del DOM: coloca las tarjetas según el desplazamiento y devuelve dónde quedó cada foto visible.
import { PerspectiveCamera, PlaneGeometry, Scene } from 'three';
import { createFloor } from './ribbonFloor';
import { CAMERA, CARD, layoutFor, type RibbonLayout } from './ribbonGeometry';
import { createSharedUniforms } from './ribbonShader';
import { createSlots, disposeSlots, placeSlot, type ScenePhoto, type Slot } from './ribbonSlots';
import type { PhotoCache } from './ribbonTextures';
import type { RibbonTheme } from './ribbonTheme';
import { applyColors, applyLayout } from './ribbonUniforms';
import { mod, slotCount, visibleSlots } from './ribbonWrap';

/** Más allá de esto (en halfW, más media tarjeta) una tarjeta ya no asoma: la cámara ve hasta ~1,1. */
const REACH = 1.3;

export interface Placed {
  index: number;
  /** Centro de la tarjeta en el mundo. */
  x: number;
}

export interface RibbonScene {
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;
  readonly layout: RibbonLayout;
  resize(width: number, height: number, pixelRatio: number): void;
  setPhotos(photos: readonly ScenePhoto[]): void;
  setTheme(theme: RibbonTheme): void;
  /** Coloca las tarjetas; devuelve la copia más centrada de cada foto que se ve. */
  update(offset: number, focused: number): Placed[];
  dispose(): void;
}

export function createRibbonScene(cache: PhotoCache, anisotropy: number): RibbonScene {
  const scene = new Scene();
  const camera = new PerspectiveCamera(CAMERA.fov, 1, CAMERA.near, CAMERA.far);
  camera.position.z = CAMERA.z;
  camera.updateMatrixWorld();
  const geometry = new PlaneGeometry(1, 1, CARD.segmentsX, CARD.segmentsY);
  const shared = createSharedUniforms();
  const floor = createFloor();
  scene.add(floor.mesh);
  let [layout, pixelRatio, version, band] = [layoutFor(1, 1), 1, 0, ''];
  let [slots, photos, theme] = [[] as Slot[], [] as readonly ScenePhoto[], null as RibbonTheme | null];
  const range = () => REACH * layout.halfW + layout.cardW / 2;

  return {
    scene,
    camera,
    get layout() {
      return layout;
    },
    resize(width, height, ratio) {
      [layout, pixelRatio] = [layoutFor(width, height), ratio];
      camera.aspect = layout.width / layout.height;
      camera.updateProjectionMatrix();
      applyLayout(shared, layout);
      // Se rehacen las ranuras solo si hacen falta otras tantas o si cambia el tamaño de la franja de su
      // etiqueta en píxeles reales: three no cambia el tamaño de una textura ya subida a la GPU.
      const [count, next] = [slotCount(layout.pitch, range()), `${Math.round((layout.cardW / layout.unitsPerPixel) * ratio)}@${ratio}`];
      if (count === slots.length && next === band) return;
      band = next;
      disposeSlots(slots, scene);
      slots = createSlots(count, geometry, shared, scene, anisotropy); // nacen sin pintar: se pintan al verse
    },
    setPhotos(next) {
      [photos, version] = [next, version + 1];
    },
    setTheme(next) {
      [theme, version] = [next, version + 1];
      applyColors(shared, next);
      floor.setColor(next.line);
    },
    update(offset, focused) {
      for (const slot of slots) slot.mesh.visible = false;
      floor.setOffset(offset);
      if (!photos.length || !slots.length) return [];
      const nearest = new Map<number, number>();
      const { first, last } = visibleSlots(offset, layout.pitch, range());
      const at = { layout, pixelRatio, palette: theme?.label ?? null, version, cache };
      for (let k = first; k <= last; k += 1) {
        const [index, x] = [mod(k, photos.length), k * layout.pitch - offset];
        const photo = photos[index];
        const slot = slots[mod(k, slots.length)];
        if (!photo || !slot) continue;
        placeSlot(slot, photo, index, x, index === focused, at);
        const known = nearest.get(index);
        if (known === undefined || Math.abs(x) < Math.abs(known)) nearest.set(index, x);
      }
      return [...nearest].map(([index, x]) => ({ index, x }));
    },
    dispose() {
      disposeSlots(slots, scene);
      geometry.dispose();
      floor.dispose();
    },
  };
}
