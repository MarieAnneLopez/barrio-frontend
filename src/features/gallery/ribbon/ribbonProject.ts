// Proyección de la geometría deformada a la pantalla, con la misma cámara que dibuja: de aquí salen
// las zonas de clic de los botones nativos que van sobre el lienzo. Funciones puras.
import { CAMERA, deform, type RibbonLayout } from './ribbonGeometry';

type Point = readonly [number, number, number];

/** Punto del mundo → px CSS del lienzo (origen arriba a la izquierda). */
export function project([x, y, z]: Point, layout: RibbonLayout): [number, number] {
  const scale = CAMERA.z / (CAMERA.z - z); // perspectiva: lo cercano crece
  return [
    layout.width / 2 + ((x * scale) / layout.halfW) * (layout.width / 2),
    layout.height / 2 - ((y * scale) / layout.halfH) * (layout.height / 2),
  ];
}

export interface Zone {
  left: number;
  top: number;
  width: number;
  height: number;
  /** Puntos del contorno, relativos a la caja, listos para clip-path: polygon(). */
  points: string;
}

/** Puntos que se toman en cada borde largo (los cortos son casi rectos). */
const SAMPLES = 8;

/** Contorno en pantalla de la tarjeta cuyo centro está en `centerX`: bordes superior e inferior curvados. */
export function cardZone(centerX: number, layout: RibbonLayout): Zone {
  const edge = (y: number) =>
    Array.from({ length: SAMPLES + 1 }, (_, at) =>
      project(deform(centerX + (at / SAMPLES - 0.5) * layout.cardW, y, layout.halfW), layout));
  const outline = [...edge(layout.cardH / 2), ...edge(-layout.cardH / 2).reverse()];
  const xs = outline.map(([x]) => x);
  const ys = outline.map(([, y]) => y);
  const [left, top] = [Math.min(...xs), Math.min(...ys)];
  return {
    left,
    top,
    width: Math.max(...xs) - left,
    height: Math.max(...ys) - top,
    points: outline.map(([x, y]) => `${(x - left).toFixed(1)}px ${(y - top).toFixed(1)}px`).join(', '),
  };
}

/** ¿Asoma la zona dentro del lienzo? */
export function onScreen(zone: Zone, layout: RibbonLayout): boolean {
  return zone.left < layout.width && zone.top < layout.height && zone.left + zone.width > 0 && zone.top + zone.height > 0;
}
