// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { carModel, personModel, planeModel } from './models';

/** Caras de la parte `part` cuya normal no apunta hacia afuera de `center` (piezas convexas). */
function inwardFaces(model: ReturnType<typeof personModel>, part: number, center: Vector3): number {
  const pos = model.getAttribute('position');
  const parts = model.getAttribute('aPart');
  const [a, b, c] = [new Vector3(), new Vector3(), new Vector3()];
  let wrong = 0;
  for (let i = 0; i < pos.count; i += 3) {
    if (Math.round(parts.getX(i)) !== part) continue;
    [a, b, c].forEach((v, k) => v.fromBufferAttribute(pos, i + k));
    const normal = new Vector3().subVectors(b, a).cross(new Vector3().subVectors(c, a));
    if (normal.length() < 1e-6) continue; // triángulos degenerados en los polos
    const out = a.clone().add(b).add(c).divideScalar(3).sub(center);
    if (normal.dot(out) <= 0) wrong += 1;
  }
  return wrong;
}

describe('modelos low-poly de la vida', () => {
  it('personita: cabeza redonda sobre un cuerpo redondeado, con las caras hacia afuera', () => {
    const person = personModel();
    expect(inwardFaces(person, 0, new Vector3(0, 1.24, 0))).toBe(0);
    expect(inwardFaces(person, 1, new Vector3(0, 0.5, 0))).toBe(0);
    person.computeBoundingBox();
    expect(person.boundingBox?.max.y).toBeCloseTo(1.51, 2);
    expect(person.getAttribute('position').count / 3).toBeLessThan(130);
  });

  it('carro y avión miran hacia +x, con su base en y = 0 (carro) y pocas caras', () => {
    const car = carModel();
    car.computeBoundingBox();
    expect(car.boundingBox?.min.y).toBeCloseTo(0.02, 2);
    expect(car.boundingBox?.max.x).toBeCloseTo(2.25, 2);
    expect(car.getAttribute('position').count / 3).toBeLessThanOrEqual(72);
    const plane = planeModel();
    plane.computeBoundingBox();
    expect(plane.boundingBox?.max.x).toBeCloseTo(20, 0);
    expect(plane.getAttribute('position').count / 3).toBeLessThan(200);
  });
});
