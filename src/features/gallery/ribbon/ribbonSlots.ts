// Ranuras de la cinta: unas pocas mallas que se reparten las posiciones visibles. La ranura k muestra la
// foto k mod N; cuando cambia de foto se repinta su franja de etiqueta (una textura por ranura).
import { CanvasTexture, Mesh, type PlaneGeometry, type Scene, SRGBColorSpace } from 'three';
import { surfaceAt, type RibbonLayout } from './ribbonGeometry';
import { type LabelPalette, paintLabel } from './ribbonLabel';
import { textureUrl } from './ribbonPhotos';
import { type CardUniforms, coverUv, createCardMaterial, type SharedUniforms } from './ribbonShader';
import type { PhotoCache } from './ribbonTextures';

export interface ScenePhoto {
  src: string;
  label: string;
}

export interface Slot {
  mesh: Mesh;
  uniforms: CardUniforms;
  label: CanvasTexture;
  /** Qué se pintó en la franja («foto|versión»): si cambia, se repinta. */
  painted: string;
}

export function createSlots(count: number, geometry: PlaneGeometry, shared: SharedUniforms, scene: Scene, anisotropy: number): Slot[] {
  return Array.from({ length: count }, () => {
    const label = new CanvasTexture(document.createElement('canvas'));
    label.colorSpace = SRGBColorSpace;
    label.anisotropy = anisotropy;
    const { material, uniforms } = createCardMaterial(shared, label);
    const mesh = new Mesh(geometry, material);
    mesh.frustumCulled = false; // el shader mueve los vértices: la esfera de la geometría no vale
    mesh.visible = false;
    scene.add(mesh);
    return { mesh, uniforms, label, painted: '' };
  });
}

export function disposeSlots(slots: readonly Slot[], scene: Scene): void {
  for (const slot of slots) {
    scene.remove(slot.mesh);
    (slot.mesh.material as { dispose(): void }).dispose();
    slot.label.dispose();
  }
}

export interface Placement {
  layout: RibbonLayout;
  pixelRatio: number;
  palette: LabelPalette | null;
  version: number;
  cache: PhotoCache;
}

/** Coloca la ranura en `x` con la foto `index`; pinta la franja y pide la foto si hace falta. */
export function placeSlot(slot: Slot, photo: ScenePhoto, index: number, x: number, focused: boolean, at: Placement): void {
  const { layout, pixelRatio, palette, version, cache } = at;
  const cssWidth = layout.cardW / layout.unitsPerPixel;
  slot.mesh.visible = true;
  slot.mesh.renderOrder = surfaceAt(x, layout.halfW).z; // lo que está más cerca se dibuja encima
  slot.uniforms.uCenter.value = x;
  slot.uniforms.uFocus.value = focused ? 1 : 0;
  const tag = `${index}|${version}`;
  if (palette && slot.painted !== tag) {
    paintLabel(slot.label.image as HTMLCanvasElement, photo.label, palette, cssWidth, pixelRatio);
    slot.label.needsUpdate = true;
    slot.painted = tag;
  }
  const ready = cache.get(textureUrl(photo.src, cssWidth * pixelRatio));
  slot.uniforms.uHasPhoto.value = ready ? 1 : 0;
  slot.uniforms.uPhoto.value = ready?.texture ?? null;
  slot.uniforms.uCover.value.set(...coverUv(ready?.aspect ?? 0, layout.cardW / layout.cardH));
}
