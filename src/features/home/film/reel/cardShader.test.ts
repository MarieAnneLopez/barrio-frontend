import { CanvasTexture, FrontSide } from 'three';
import { describe, expect, it } from 'vitest';
import { createCardMaterial, createSharedUniforms, FRAGMENT, VERTEX } from './cardShader';
import { BEND_REST } from './reelBend';

const texture = () => new CanvasTexture(document.createElement('canvas'));

describe('shader de la tarjeta', () => {
  it('el vértice curva el plano con la cuenta de la especificación (la misma de bendPoint)', () => {
    expect(VERTEX).toContain('float angle = (p.x / 1.19000) * uBend;');
    expect(VERTEX).toContain('float radius = 1.19000 / uBend;');
    expect(VERTEX).toContain('p.x = sin(angle) * radius;');
    expect(VERTEX).toContain('p.z += (cos(angle) - 1.0) * radius;');
  });

  it('ondulación vertical de 0,006 que avanza con el reloj del reel', () => {
    expect(VERTEX).toMatch(/p\.y \+= sin\([^;]*uTime[^;]*\) \* 0\.00600;/);
  });

  it('el fragmento redondea las esquinas con una SDF antialiasada y sombrea según la curvatura', () => {
    expect(FRAGMENT).toContain('vec2(2.38000, 1.57710)'); // tamaño del plano
    expect(FRAGMENT).toMatch(/length\(max\(q, 0\.0\)\) \+ min\(max\(q\.x, q\.y\), 0\.0\) - uRadius/);
    expect(FRAGMENT).toMatch(/fwidth\(d\)/);
    expect(FRAGMENT).toMatch(/smoothstep/);
    expect(FRAGMENT).toMatch(/vFacing/);
    expect(VERTEX).toMatch(/vFacing = normalize\(normalMatrix \* vec3\(sin\(angle\), 0\.0, cos\(angle\)\)\)\.z;/);
    expect(FRAGMENT).not.toMatch(/discard/);
  });

  it('sale en el espacio de color del lienzo', () => {
    expect(FRAGMENT).toContain('#include <colorspace_fragment>');
  });
});

describe('material de la tarjeta', () => {
  it('transparente (lienzo sin fondo), sin profundidad y con las caras traseras ocultas', () => {
    const map = texture();
    const material = createCardMaterial(map, createSharedUniforms(), 3);
    expect([material.transparent, material.depthTest, material.depthWrite]).toEqual([true, false, false]);
    expect(material.side).toBe(FrontSide);
    expect(material.uniforms.uMap?.value).toBe(map);
    expect(material.uniforms.uSeed?.value).toBe(3);
    expect([material.vertexShader, material.fragmentShader]).toEqual([VERTEX, FRAGMENT]);
  });

  it('las 14 tarjetas comparten curvatura, reloj, radio y colores de borde', () => {
    const shared = createSharedUniforms();
    const [first, second] = [createCardMaterial(texture(), shared, 0), createCardMaterial(texture(), shared, 1)];
    expect(shared.uBend.value).toBe(BEND_REST);
    shared.uBend.value = 0.42;
    shared.uTime.value = 7;
    for (const material of [first, second]) {
      expect(material.uniforms.uBend?.value).toBe(0.42);
      expect(material.uniforms.uTime?.value).toBe(7);
      expect(material.uniforms.uRadius).toBe(shared.uRadius);
      expect(material.uniforms.uPixel).toBe(shared.uPixel);
      expect(material.uniforms.uLine).toBe(shared.uLine);
      expect(material.uniforms.uGap).toBe(shared.uGap);
    }
    expect(first.uniforms.uMap).not.toBe(second.uniforms.uMap);
  });
});
