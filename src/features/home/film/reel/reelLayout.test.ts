import { describe, expect, it } from 'vitest';
import { BEND_REST, bendPoint, HALF_WIDTH } from './reelBend';
import { CAMERA, DEPTH_RATIO, layoutFor, RADIUS_RATIO, type ReelLayout, targetFraction } from './reelLayout';
import { cardPose, PITCH } from './reelMath';

const TAN = Math.tan((CAMERA.fov * Math.PI) / 360);
// El lienzo va bajo el header de 64 px: 1440 × 900 → 1440 × 836 y 390 × 844 → 390 × 780.
const DESKTOP = [1440, 836] as const;
const PHONE = [390, 780] as const;

/** Proyecta la columna `u` (−1 borde izquierdo … 1 derecho) de la tarjeta `relative`, con la cámara de verdad. */
function column(relative: number, u: number, layout: ReelLayout, aspect: number) {
  const pose = cardPose(relative, layout);
  const local = bendPoint(u * HALF_WIDTH, 0, BEND_REST);
  const [cos, sin] = [Math.cos(pose.rotationY), Math.sin(pose.rotationY)];
  const x = pose.x + (local.x * cos + local.z * sin) * layout.scale;
  const z = pose.z + (local.z * cos - local.x * sin) * layout.scale;
  const turn = u * BEND_REST + pose.rotationY; // normal de la columna, girada con la tarjeta
  const facing = Math.sin(turn) * -x + Math.cos(turn) * (CAMERA.z - z) > 0;
  return { screen: x / ((CAMERA.z - z) * TAN * aspect), facing };
}
const COLUMNS = [-1, -0.5, 0, 0.5, 1];

describe('trazado del reel', () => {
  it('cámara: fov 65,7, z 8,1, near 0,1 y far 40', () => {
    expect(CAMERA).toEqual({ fov: 65.7, z: 8.1, near: 0.1, far: 40 });
  });

  it('la tarjeta central ocupa el 37 % del ancho en escritorio', () => {
    const layout = layoutFor(...DESKTOP);
    expect(layout.fraction).toBeCloseTo(0.37, 4);
    expect(column(0, 1, layout, 1440 / 836).screen).toBeCloseTo(0.37, 4); // medido con la proyección
    expect(layout.cardWidth).toBeCloseTo(532.8, 1);
  });

  it('y el 77 % en teléfono', () => {
    const layout = layoutFor(...PHONE);
    expect(layout.fraction).toBeCloseTo(0.77, 4);
    expect(column(0, 1, layout, 390 / 780).screen).toBeCloseTo(0.77, 4);
    expect(layout.cardWidth).toBeCloseTo(300.3, 1);
  });

  it('valores elegidos: escala, trackRadius, trackDepth y pitch a 1440 y a 390 px', () => {
    const [desktop, phone] = [layoutFor(...DESKTOP), layoutFor(...PHONE)];
    expect([desktop.scale, desktop.radius, desktop.depth, desktop.pitch].map((v) => Number(v.toFixed(3)))).toEqual([2.222, 7.999, 2.444, 1.155]);
    expect([phone.scale, phone.radius, phone.depth, phone.pitch].map((v) => Number(v.toFixed(3)))).toEqual([1.486, 5.351, 1.635, 0.773]);
    expect([RADIUS_RATIO, DEPTH_RATIO]).toEqual([3.6, 1.1]);
    expect(desktop.pitch).toBeCloseTo(PITCH * desktop.scale, 12);
  });

  it.each([[1440, 836], [1920, 1016], [1280, 656], [1024, 704]])(
    'en escritorio (%i × %i) se ven 3 a la vez: las vecinas dentro y las siguientes de espaldas', (width, height) => {
      const layout = layoutFor(width, height);
      for (const side of [-1, 1]) {
        for (const u of COLUMNS) {
          const neighbour = column(side, u, layout, width / height);
          expect(neighbour.facing).toBe(true);
          expect(Math.abs(neighbour.screen)).toBeLessThan(1);
          expect(column(2 * side, u, layout, width / height).facing).toBe(false);
        }
      }
    });

  it('las vecinas no pisan a la central: quedan a su lado, con un hueco', () => {
    const layout = layoutFor(...DESKTOP);
    expect(column(1, -1, layout, 1440 / 836).screen).toBeGreaterThan(column(0, 1, layout, 1440 / 836).screen);
    expect(column(0.5, -1, layout, 1440 / 836).screen).toBeGreaterThan(0); // a medio camino no se cruzan
  });

  it('entre teléfono y escritorio la fracción baja del 77 % al 37 % sin saltos', () => {
    expect([0.3, 0.5, 1, 1.5, 2.4].map(targetFraction).map((v) => Number(v.toFixed(3)))).toEqual([0.77, 0.77, 0.57, 0.37, 0.37]);
    const tablet = layoutFor(768, 960);
    expect(tablet.fraction).toBeCloseTo(0.65, 4);
  });

  it('en pantallas muy anchas manda el alto: la tarjeta no pasa del 53 % del lienzo', () => {
    const wide = layoutFor(2560, 1016);
    expect(wide.cardHeight / 1016).toBeCloseTo(0.53, 4);
    expect(wide.fraction).toBeLessThan(0.37);
    expect(layoutFor(...DESKTOP).cardHeight / 836).toBeLessThan(0.53);
  });
});
