import { Material, type Mesh, type ShaderMaterial } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeCanvas2d } from './ribbonCanvasKit';
import { createRibbonScene } from './ribbonScene';
import type { PhotoCache } from './ribbonTextures';

afterEach(() => vi.restoreAllMocks());

const cache: PhotoCache = { get: () => null, beginFrame: () => undefined, size: 0, dispose: () => undefined };
const THEME = {
  placeholder: 'gray', sheen: 'white', ring: 'yellow', ringInner: 'black', line: 'brown',
  label: { chip: 'white', ink: 'black', mark: 'yellow', markInk: 'black', fade: 'white', font: 'serif' },
};
/** Escena con una foto, ya pintada una vez a 1440 × 836. */
function scene() {
  const painted = fakeCanvas2d();
  const ribbon = createRibbonScene(cache, 1);
  ribbon.resize(1440, 836, 1);
  ribbon.setPhotos([{ src: '/a-1280.webp', label: 'Calle 6' }]);
  ribbon.setTheme(THEME);
  ribbon.update(0, -1);
  const slots = () => ribbon.scene.children.filter((child) => (child as Mesh).isMesh && 'uCenter' in ((child as Mesh).material as ShaderMaterial).uniforms);
  return { ribbon, painted, slots, freed: vi.spyOn(Material.prototype, 'dispose') };
}

describe('escena de la cinta al cambiar de tamaño', () => {
  it('el mismo tamaño no rehace nada; otro ancho con la misma franja de etiqueta tampoco la repinta', () => {
    const { ribbon, painted, slots, freed } = scene();
    const [before, texts] = [slots(), painted.texts.length];
    ribbon.resize(1440, 836, 1);
    ribbon.resize(1460, 836, 1); // la tarjeta la marca el alto: su franja mide lo mismo
    ribbon.update(0, -1);
    expect(freed).not.toHaveBeenCalled();
    expect(slots()).toEqual(before);
    expect(painted.texts).toHaveLength(texts);
    expect(ribbon.layout.width).toBe(1460);
  });

  it('si cambia la franja (otro alto u otro pixel ratio), se rehacen: three no agranda una textura ya subida', () => {
    const { ribbon, painted, slots, freed } = scene();
    const [count, texts] = [slots().length, painted.texts.length];
    ribbon.resize(1440, 700, 1);
    expect(freed).toHaveBeenCalledTimes(count);
    const after = slots().length;
    ribbon.resize(1440, 700, 1.5);
    expect(freed).toHaveBeenCalledTimes(count + after);
    ribbon.update(0, -1);
    expect(painted.texts.length).toBeGreaterThan(texts);
  });
});
