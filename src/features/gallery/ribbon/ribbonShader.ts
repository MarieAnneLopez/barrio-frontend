// Material de cada tarjeta de la cinta: uniformes compartidos por todas (tamaño, mundo visible,
// colores del tema) y propios de cada ranura (posición, foto, encuadre, etiqueta y foco).
import { Color, FrontSide, ShaderMaterial, type Texture, Vector2, Vector4 } from 'three';
import { FRAGMENT, VERTEX } from './ribbonGlsl';

export interface SharedUniforms {
  uHalfW: { value: number };
  uSize: { value: Vector2 };
  /** Radio de las esquinas (20 px) y 1 px, en unidades del mundo. */
  uRadius: { value: number };
  uPixel: { value: number };
  /** Parte del alto de la tarjeta que ocupa la franja de la etiqueta. */
  uLabelBand: { value: number };
  uDepthRange: { value: number };
  uPlaceholder: { value: Color };
  uSheen: { value: Color };
  uRing: { value: Color };
  uRingInner: { value: Color };
}

export interface CardUniforms {
  uCenter: { value: number };
  uPhoto: { value: Texture | null };
  uHasPhoto: { value: number };
  /** Encuadre «cover» de la foto: escala (xy) y desplazamiento (zw) de las UV. */
  uCover: { value: Vector4 };
  uLabel: { value: Texture };
  uFocus: { value: number };
}

export const createSharedUniforms = (): SharedUniforms => ({
  uHalfW: { value: 1 },
  uSize: { value: new Vector2(1, 1) },
  uRadius: { value: 0 },
  uPixel: { value: 0 },
  uLabelBand: { value: 0.3 },
  uDepthRange: { value: 1 },
  uPlaceholder: { value: new Color() },
  uSheen: { value: new Color() },
  uRing: { value: new Color() },
  uRingInner: { value: new Color() },
});

/** Escala y desplazamiento de las UV para que una foto de `image` (ancho / alto) cubra un plano de `plane`. */
export function coverUv(image: number, plane: number): [number, number, number, number] {
  if (!(image > 0) || !(plane > 0)) return [1, 1, 0, 0];
  const [sx, sy] = image > plane ? [plane / image, 1] : [1, image / plane];
  return [sx, sy, (1 - sx) / 2, (1 - sy) / 2];
}

/** Transparente (el lienzo no tiene fondo), sin profundidad (manda el orden de dibujo) y sin caras traseras. */
export function createCardMaterial(shared: SharedUniforms, label: Texture): { material: ShaderMaterial; uniforms: CardUniforms } {
  const uniforms: CardUniforms = {
    uCenter: { value: 0 },
    uPhoto: { value: null },
    uHasPhoto: { value: 0 },
    uCover: { value: new Vector4(1, 1, 0, 0) },
    uLabel: { value: label },
    uFocus: { value: 0 },
  };
  const material = new ShaderMaterial({
    uniforms: { ...shared, ...uniforms },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: FrontSide,
  });
  return { material, uniforms };
}
