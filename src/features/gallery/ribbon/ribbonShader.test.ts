import { CanvasTexture, FrontSide } from 'three';
import { describe, expect, it } from 'vitest';
import { FRAGMENT, VERTEX } from './ribbonGlsl';
import { coverUv, createCardMaterial, createSharedUniforms } from './ribbonShader';

const label = () => new CanvasTexture(document.createElement('canvas'));

describe('shader de la cinta', () => {
  it('el vértice hace la cuenta de la superficie: q, curva en S, peralte y bisagra, sin onda en y', () => {
    expect(VERTEX).toContain('float q = (x / uHalfW) * 1.15000 - 0.20000;');
    expect(VERTEX).toContain('float slope = (PI * cq - 2.0 * q * sq) * g;');
    expect(VERTEX).toContain('float bank = -0.16000 * slope / PI;');
    expect(VERTEX).toContain('float z = -0.20000 * uHalfW * sq * g - 0.12000 * uHalfW * s * (1.5 - 0.5 * s * s);');
    expect(VERTEX).toContain('vec3 p = vec3(x, y * cb, y * sb + z);');
    expect(VERTEX).not.toMatch(/uTime|uSpeed|uVelocity/);
  });

  it('el fragmento recorta las esquinas con una SDF y sombrea con la luz (−0,4, 0,5, 1), difusa 0,12 y brillo 48 / 0,35', () => {
    expect(FRAGMENT).toMatch(/length\(max\(q, 0\.0\)\) \+ min\(max\(q\.x, q\.y\), 0\.0\) - uRadius/);
    expect(FRAGMENT).toContain('vec3 l = vec3(-0.33686, 0.42108, 0.84215);');
    expect(FRAGMENT).toContain('float diffuse = 0.88000 + 0.12000 * max(dot(n, l), 0.0);');
    expect(FRAGMENT).toContain('pow(max(dot(n, normalize(l + v)), 0.0), 48.00000)');
    expect(FRAGMENT).toContain('0.35000 *');
    expect(FRAGMENT).toContain('1.0 - 0.80000 * clamp(-vWorld.z / uDepthRange, 0.0, 1.0)');
  });

  it('la foto se encuadra en modo cover y la etiqueta va encima con un brillo mínimo', () => {
    expect(FRAGMENT).toContain('texture2D(uPhoto, vUv * uCover.xy + uCover.zw)');
    expect(FRAGMENT).toContain('max(depth, 0.60000)');
    expect(FRAGMENT).toContain('#include <colorspace_fragment>');
  });
});

describe('material y encuadre', () => {
  it('cover: una foto más ancha que el plano se recorta a los lados; una más alta, arriba y abajo', () => {
    expect(coverUv(2, 1)).toEqual([0.5, 1, 0.25, 0]);
    expect(coverUv(1, 2)).toEqual([1, 0.5, 0, 0.25]);
    expect(coverUv(1.6, 1.6)).toEqual([1, 1, 0, 0]);
    expect(coverUv(0, 1.6)).toEqual([1, 1, 0, 0]);
  });

  it('transparente, sin profundidad y con las caras traseras ocultas; los uniformes comunes se comparten', () => {
    const shared = createSharedUniforms();
    const [first, second] = [createCardMaterial(shared, label()), createCardMaterial(shared, label())];
    expect([first.material.transparent, first.material.depthTest, first.material.depthWrite]).toEqual([true, false, false]);
    expect(first.material.side).toBe(FrontSide);
    expect(first.material.uniforms.uHalfW).toBe(second.material.uniforms.uHalfW);
    expect(first.material.uniforms.uCenter).not.toBe(second.material.uniforms.uCenter);
    expect(first.material.uniforms.uCenter).toBe(first.uniforms.uCenter);
    expect(first.uniforms.uPhoto.value).toBeNull();
  });
});
