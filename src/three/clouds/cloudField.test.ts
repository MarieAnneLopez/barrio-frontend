import { Color } from 'three';
import { describe, expect, it } from 'vitest';
import { ISLAND_TIP, islandGeometry, simplifyRing } from '../island/islandGeometry';
import { CLOUD_CLEARANCE, CLOUD_HALF_HEIGHT, cloudField } from './cloudField';

describe('nubes alrededor y debajo de la isla', () => {
  const clouds = cloudField(120, -40, 2600, 90);

  it('ninguna nube asoma sobre el suelo: nunca tapan edificios ni marcadores', () => {
    for (const cloud of clouds) expect(cloud.y + cloud.size * CLOUD_HALF_HEIGHT).toBeLessThanOrEqual(-CLOUD_CLEARANCE);
  });

  it('rodean la isla: unas cerca y otras lejos, en todas las direcciones', () => {
    const distances = clouds.map((c) => Math.hypot(c.x - 120, c.z + 40));
    expect(Math.min(...distances)).toBeGreaterThanOrEqual(2600 * 0.55 - 1);
    expect(Math.max(...distances)).toBeLessThanOrEqual(2600 * 1.3 + 1);
    const quadrants = new Set(clouds.map((c) => `${c.x > 120}${c.z > -40}`));
    expect(quadrants.size).toBe(4);
  });

  it('son las mismas en cada visita', () => {
    expect(cloudField(120, -40, 2600, 90)).toEqual(clouds);
  });
});

describe('isla bajo el barrio', () => {
  // Un cuadrado de 1 km como borde del barrio.
  const square = [0, 0, 1000, 0, 1000, 1000, 0, 1000];
  const earth = new Color(1, 0, 0);
  const rock = new Color(0, 0, 1);

  it('baja desde el borde (y = 0) hasta la punta y nunca sube sobre el suelo', () => {
    const geometry = islandGeometry(square, earth, rock);
    const y = geometry.getAttribute('position');
    let [top, bottom] = [-Infinity, Infinity];
    for (let i = 0; i < y.count; i++) [top, bottom] = [Math.max(top, y.getY(i)), Math.min(bottom, y.getY(i))];
    expect(top).toBe(0);
    expect(bottom).toBe(ISLAND_TIP);
  });

  it('el borde de arriba coincide con el del barrio y lleva el color de tierra', () => {
    const geometry = islandGeometry(square, earth, rock);
    const [p, c] = [geometry.getAttribute('position'), geometry.getAttribute('color')];
    for (let i = 0; i < p.count; i++) {
      if (p.getY(i) !== 0) continue;
      expect([0, 1000]).toContain(Math.round(p.getX(i)));
      expect(c.getX(i)).toBe(1);
    }
  });

  it('un borde largo se reduce a lo sumo a 220 puntos', () => {
    const long = Array.from({ length: 5000 }, (_, i) => [Math.cos(i / 800), Math.sin(i / 800)]).flat();
    expect(simplifyRing(long).length / 2).toBeLessThanOrEqual(220);
  });
});
