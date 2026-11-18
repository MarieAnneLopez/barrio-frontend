// Geometría de la cinta curva de la Galería: cámara, tamaño de las tarjetas y la superficie por la
// que se deslizan. Funciones puras: el shader de vértices (ribbonShader.ts) hace la misma cuenta.

export const CAMERA = { fov: 53.4, z: 41.18, near: 0.1, far: 2000 } as const;
/** Tarjetas: alto del 52 % del mundo visible, 16:10 (como su malla de 64 × 40), 20 px entre ellas. */
export const CARD = { heightShare: 0.52, aspect: 1.6, gapPx: 20, maxWidthShare: 0.88, segmentsX: 64, segmentsY: 40 } as const;
/** q = (x / halfW) · 1,15 − 0,2; D = 0,2 · halfW; peralte −0,16 · derivada / π; bisagra −0,12 · halfW. */
export const SURFACE = { stretch: 1.15, shift: 0.2, depth: 0.2, bank: 0.16, hinge: 0.12 } as const;

/** Mitad del alto visible en z = 0: tan(FOV / 2) · z de la cámara. */
export const HALF_H = Math.tan((CAMERA.fov * Math.PI) / 360) * CAMERA.z;

export interface RibbonLayout {
  /** Lienzo en px CSS. */
  width: number;
  height: number;
  /** Mitades del mundo visible en z = 0. */
  halfW: number;
  halfH: number;
  cardW: number;
  cardH: number;
  gap: number;
  /** Paso entre dos tarjetas seguidas: ancho más separación. */
  pitch: number;
  /** Lo que mide 1 px CSS en z = 0, en unidades del mundo. */
  unitsPerPixel: number;
}

export function layoutFor(width: number, height: number): RibbonLayout {
  const h = Math.max(height, 1);
  const halfW = HALF_H * (Math.max(width, 1) / h);
  const unitsPerPixel = (2 * HALF_H) / h;
  const cardH = CARD.heightShare * 2 * HALF_H;
  const cardW = Math.min(cardH * CARD.aspect, CARD.maxWidthShare * 2 * halfW); // tope del 88 % (móvil)
  const gap = CARD.gapPx * unitsPerPixel;
  return { width: Math.max(width, 1), height: h, halfW, halfH: HALF_H, cardW, cardH, gap, pitch: cardW + gap, unitsPerPixel };
}

export interface Surface {
  /** Empuje en z del punto (y = 0) y peralte, en radianes. */
  z: number;
  bank: number;
  /** Derivadas respecto a x, para la normal analítica. */
  zSlope: number;
  bankSlope: number;
}

/** Perfil de la cinta en la x del mundo: curva en S (sin(π q) · e^(−q²)) más la bisagra. */
export function surfaceAt(x: number, halfW: number): Surface {
  const q = (x / halfW) * SURFACE.stretch - SURFACE.shift;
  const g = Math.exp(-q * q);
  const [sin, cos] = [Math.sin(Math.PI * q), Math.cos(Math.PI * q)];
  const slope = (Math.PI * cos - 2 * q * sin) * g; // d shape / dq
  const curve = ((4 * q * q - 2 - Math.PI ** 2) * sin - 4 * Math.PI * q * cos) * g; // d² shape / dq²
  const s = Math.min(1, Math.max(-1, x / halfW));
  const dq = SURFACE.stretch / halfW;
  const depth = SURFACE.depth * halfW;
  const inside = Math.abs(x) < halfW ? 1 : 0;
  return {
    z: -depth * sin * g - SURFACE.hinge * halfW * s * (1.5 - 0.5 * s * s),
    bank: (-SURFACE.bank * slope) / Math.PI,
    zSlope: -depth * slope * dq - SURFACE.hinge * 1.5 * (1 - s * s) * inside,
    bankSlope: (-SURFACE.bank * curve * dq) / Math.PI,
  };
}

/** Punto (x, y) del plano ya deformado: el peralte gira (y, z) sobre el eje x y luego se empuja z. */
export function deform(x: number, y: number, halfW: number): [number, number, number] {
  const { z, bank } = surfaceAt(x, halfW);
  return [x, y * Math.cos(bank), y * Math.sin(bank) + z];
}

/** Normal unitaria de la superficie deformada (∂P/∂x × ∂P/∂y), hacia la cámara. */
export function normalAt(x: number, y: number, halfW: number): [number, number, number] {
  const { bank, zSlope, bankSlope } = surfaceAt(x, halfW);
  const [cos, sin] = [Math.cos(bank), Math.sin(bank)];
  const normal: [number, number, number] = [-y * bankSlope - zSlope * cos, -sin, cos];
  const length = Math.hypot(...normal);
  return [normal[0] / length, normal[1] / length, normal[2] / length];
}
