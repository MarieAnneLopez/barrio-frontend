import type { Mesh, PlaneGeometry, ShaderMaterial } from 'three';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RING } from './cardShader';
import { coverNumber } from './coverLayout';
import { fakeCanvas2d } from './glKit';
import { cardPose } from './reelMath';
import { createReelScene, type ReelScene } from './reelScene';

const palette = { card: 'black', ink: 'white', accent: 'orange', line: 'gray', gap: 'white', display: 'sans-serif' };
const covers = Array.from({ length: 14 }, (_, index) => ({ number: coverNumber(index + 1), name: `Módulo ${index + 1}` }));
let reel: ReelScene;
const meshes = () => reel.scene.children as Mesh[];
const visible = () => meshes().flatMap((mesh, index) => (mesh.visible ? [index] : []));

beforeEach(() => {
  fakeCanvas2d();
  reel = createReelScene(14, 4);
});
afterEach(() => {
  reel.dispose();
  vi.restoreAllMocks();
});

describe('escena del reel', () => {
  it('cámara de la especificación y un solo plano de 48 × 24 segmentos para las 14 tarjetas', () => {
    expect([reel.camera.fov, reel.camera.position.z, reel.camera.near, reel.camera.far]).toEqual([65.7, 8.1, 0.1, 40]);
    expect(meshes()).toHaveLength(14);
    expect(new Set(meshes().map((mesh) => mesh.geometry)).size).toBe(1);
    const plane = meshes()[0]?.geometry as PlaneGeometry;
    expect(plane.parameters).toMatchObject({ width: 2.38, height: 1.5771, widthSegments: 48, heightSegments: 24 });
  });

  it('sin portadas (la tipografía aún no cargó) no se dibuja ninguna tarjeta', () => {
    reel.resize(1440, 836);
    reel.update(0, 0.3, 0, 0);
    expect(visible()).toEqual([]);
  });

  it('coloca cada tarjeta en su postura y solo deja a la vista las cercanas a la fase', () => {
    reel.setCovers(covers, palette);
    const layout = reel.resize(1440, 836);
    reel.update(3, 0.3, 0.02, 0);
    expect(visible()).toEqual([1, 2, 3, 4, 5]);
    const [next, pose] = [meshes()[4] as Mesh, cardPose(1, layout, 0.02)];
    expect(next.position.toArray()).toEqual([pose.x, pose.y, pose.z]);
    expect([next.rotation.x, next.rotation.y, next.scale.x]).toEqual([pose.rotationX, pose.rotationY, layout.scale]);
    expect(meshes()[3]?.renderOrder).toBeGreaterThan(next.renderOrder); // la central se dibuja encima
    expect(reel.camera.aspect).toBeCloseTo(1440 / 836, 12);
  });

  it('el anillo no tiene principio: en el último módulo asoma el primero', () => {
    reel.setCovers(covers, palette);
    reel.resize(1440, 836);
    reel.update(13, 0.3, 0, 0);
    expect(visible()).toEqual([0, 1, 11, 12, 13]);
    expect(meshes()[0]?.position.x).toBeGreaterThan(0); // el primero, a la derecha del último
  });

  it('pasa curvatura y reloj al shader, y la tarjeta que se ve tiene esquinas de 4 px', () => {
    reel.setCovers(covers, palette);
    const layout = reel.resize(1440, 836);
    reel.update(0, 0.42, 0, 1.5);
    const { uniforms } = meshes()[0]?.material as ShaderMaterial;
    expect([uniforms.uBend?.value, uniforms.uTime?.value]).toEqual([0.42, 1.5]);
    expect(uniforms.uPixel?.value * (layout.cardWidth / 2.3445)).toBeCloseTo(1, 3); // 1 px de la tarjeta central
    expect(uniforms.uRadius?.value / uniforms.uPixel?.value - RING).toBeCloseTo(4, 9); // por dentro del anillo
  });

  it('pick da la tarjeta bajo el puntero: la central, una vecina o ninguna', () => {
    reel.setCovers(covers, palette);
    reel.resize(1440, 836);
    reel.update(5, 0.3, 0, 0);
    expect(reel.pick(0, 0)).toBe(5);
    expect(reel.pick(0.65, 0.3)).toBe(6);
    expect(reel.pick(-0.65, -0.3)).toBe(4);
    expect(reel.pick(-0.9, 0.9)).toBeNull();
    reel.update(5.5, 0.3, 0, 0); // a medio camino no hay tarjeta en el centro exacto
    expect(reel.pick(0, 0)).toBeNull();
  });
});
