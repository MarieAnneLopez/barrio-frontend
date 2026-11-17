// Escena del reel con three directo: la cámara, un plano compartido y una malla por módulo. No sabe
// del renderer ni del DOM: coloca las tarjetas según la fase y pinta cada portada al ir a verse.
import { Mesh, PerspectiveCamera, PlaneGeometry, Raycaster, Scene, Vector2 } from 'three';
import { createCardMaterial, createSharedUniforms, RING } from './cardShader';
import { type Cover, createCoverTexture, paintCover, type Palette } from './coverTexture';
import { PLANE } from './reelBend';
import { CAMERA, layoutFor, type ReelLayout } from './reelLayout';
import { cardPose, wrapRelative } from './reelMath';

/** Más lejos de la fase que esto, una tarjeta no se dibuja: está de espaldas o daría otra vuelta a la hélice. */
const VISIBLE_RANGE = 2.6;
/** Radio de las esquinas de la tarjeta central, en px. */
const CORNER = 4;

export interface ReelScene {
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;
  /** Portadas o paleta nuevas (idioma, alto contraste): se repintan al dibujarse. */
  setCovers(covers: readonly Cover[], palette: Palette): void;
  resize(width: number, height: number): ReelLayout;
  update(phase: number, bend: number, tilt: number, time: number): void;
  /** Módulo bajo un punto del lienzo (−1 … 1 en cada eje), o null si ahí solo hay papel. */
  pick(x: number, y: number): number | null;
  dispose(): void;
}

export function createReelScene(count: number, anisotropy: number): ReelScene {
  const scene = new Scene();
  const camera = new PerspectiveCamera(CAMERA.fov, 1, CAMERA.near, CAMERA.far);
  camera.position.z = CAMERA.z;
  camera.updateMatrixWorld();
  const geometry = new PlaneGeometry(PLANE.width, PLANE.height, PLANE.segmentsX, PLANE.segmentsY);
  const shared = createSharedUniforms();
  const cards = Array.from({ length: count }, (_, index) => {
    const texture = createCoverTexture(anisotropy);
    const material = createCardMaterial(texture, shared, index);
    const mesh = new Mesh(geometry, material);
    mesh.visible = false;
    scene.add(mesh);
    return { mesh, material, texture, painted: 0 };
  });
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  let layout = layoutFor(1, 1);
  let covers: readonly Cover[] = [];
  let palette: Palette | undefined;
  let version = 0;

  return {
    scene,
    camera,
    setCovers(nextCovers, nextPalette) {
      covers = nextCovers;
      palette = nextPalette;
      version += 1;
      shared.uLine.value.set(nextPalette.line);
      shared.uGap.value.set(nextPalette.gap);
    },
    resize(width, height) {
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      layout = layoutFor(width, height);
      shared.uPixel.value = layout.unitsPerPixel;
      shared.uRadius.value = (CORNER + RING) * layout.unitsPerPixel;
      return layout;
    },
    update(phase, bend, tilt, time) {
      shared.uBend.value = bend;
      shared.uTime.value = time;
      cards.forEach((card, index) => {
        const relative = wrapRelative(index - phase, count);
        const pose = cardPose(relative, layout, tilt);
        const cover = palette ? covers[index] : undefined;
        card.mesh.position.set(pose.x, pose.y, pose.z);
        card.mesh.rotation.set(pose.rotationX, pose.rotationY, 0);
        card.mesh.scale.setScalar(layout.scale);
        card.mesh.renderOrder = -Math.abs(relative); // la más centrada se dibuja encima
        card.mesh.visible = cover !== undefined && Math.abs(relative) < VISIBLE_RANGE;
        if (!cover || !palette || !card.mesh.visible || card.painted === version) return;
        paintCover(card.texture.image as HTMLCanvasElement, cover, palette);
        card.texture.needsUpdate = true;
        card.painted = version;
      });
    },
    pick(x, y) {
      scene.updateMatrixWorld();
      raycaster.setFromCamera(pointer.set(x, y), camera);
      const shown = cards.filter((card) => card.mesh.visible).map((card) => card.mesh);
      const [top] = raycaster.intersectObjects(shown, false).sort((a, b) => b.object.renderOrder - a.object.renderOrder);
      return top ? cards.findIndex((card) => card.mesh === top.object) : null;
    },
    dispose() {
      geometry.dispose();
      for (const card of cards) {
        card.material.dispose();
        card.texture.dispose();
      }
    },
  };
}
