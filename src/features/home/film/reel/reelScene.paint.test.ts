import { BufferGeometry, type CanvasTexture, Material, type Mesh, type ShaderMaterial, Texture } from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { coverNumber } from './coverLayout';
import { fakeCanvas2d } from './glKit';
import { createReelScene } from './reelScene';

const palette = { card: 'black', ink: 'white', accent: 'orange', line: 'gray', gap: 'white', display: 'sans-serif' };
const coversIn = (word: string) =>
  Array.from({ length: 14 }, (_, index) => ({ number: coverNumber(index + 1), name: `${word} ${index + 1}` }));
const numbers = (texts: { text: string }[]) => texts.map((entry) => entry.text).filter((text) => /^\d\d$/.test(text));

afterEach(() => vi.restoreAllMocks());

describe('portadas del reel', () => {
  it('pinta cada portada la primera vez que su tarjeta se ve, y no la vuelve a pintar', () => {
    const { texts } = fakeCanvas2d();
    const reel = createReelScene(14, 4);
    reel.setCovers(coversIn('Módulo'), palette);
    reel.resize(1440, 836);
    expect(texts).toEqual([]); // nada se pinta hasta que hace falta
    reel.update(0, 0.3, 0, 0);
    expect(numbers(texts).sort()).toEqual(['01', '02', '03', '13', '14']);
    reel.update(0.2, 0.3, 0, 0);
    expect(numbers(texts)).toHaveLength(5);
    reel.update(1, 0.3, 0, 0); // entra la cuarta
    expect(numbers(texts).sort()).toEqual(['01', '02', '03', '04', '13', '14']);
    reel.dispose();
  });

  it('al pintar avisa a la textura para que suba a la GPU', () => {
    fakeCanvas2d();
    const reel = createReelScene(14, 4);
    const map = () => (reel.scene.children[0] as Mesh<BufferGeometry, ShaderMaterial>).material.uniforms.uMap?.value as CanvasTexture;
    const before = map().version;
    reel.setCovers(coversIn('Módulo'), palette);
    reel.resize(1440, 836);
    reel.update(0, 0.3, 0, 0);
    expect(map().version).toBeGreaterThan(before);
    reel.dispose();
  });

  it('con portadas o paleta nuevas (idioma, alto contraste) repinta las que se ven y cambia el borde', () => {
    const { texts } = fakeCanvas2d();
    const reel = createReelScene(14, 4);
    reel.setCovers(coversIn('Módulo'), palette);
    reel.resize(1440, 836);
    reel.update(0, 0.3, 0, 0);
    reel.setCovers(coversIn('Module'), { ...palette, line: 'white', gap: 'black' });
    reel.update(0, 0.3, 0, 0);
    expect(texts.filter((entry) => entry.text.startsWith('MODULE'))).toHaveLength(5);
    const { uniforms } = (reel.scene.children[0] as Mesh<BufferGeometry, ShaderMaterial>).material;
    expect([uniforms.uLine?.value.getHexString(), uniforms.uGap?.value.getHexString()]).toEqual(['ffffff', '000000']);
    reel.dispose();
  });

  it('dispose libera la geometría, los 14 materiales y las 14 texturas', () => {
    fakeCanvas2d();
    const freed = { geometry: vi.spyOn(BufferGeometry.prototype, 'dispose'), material: vi.spyOn(Material.prototype, 'dispose'), texture: vi.spyOn(Texture.prototype, 'dispose') };
    const reel = createReelScene(14, 4);
    reel.dispose();
    expect([freed.geometry, freed.material, freed.texture].map((spy) => spy.mock.calls.length)).toEqual([1, 14, 14]);
  });
});
