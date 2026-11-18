import type { Color } from 'three';

// Resalte del edificio bajo el puntero (uHover, el amarillo del sol) y del elegido (uSelected, el
// rosa del atardecer). El tono solo no bastaba de día: sobre el concreto crema de los altos el
// amarillo al 40 % daba 1,02:1. Ahora tiene dos partes: el cuerpo se tiñe del color de la marca
// (claro) y la corona —media altura de piso bajo el remate y la cara de adentro del pretil— va en
// una sombra casi negra del mismo tono. Para cualquier luminancia de base, de día o de noche, una de
// las dos queda a ≥ 3:1 (WCAG 1.4.11): la corona contra lo claro y el cuerpo contra lo oscuro.

/** Peso del color de la marca en el cuerpo del edificio bajo el puntero y en el del elegido. */
export const HOVER_FILL = 0.6;
export const SELECT_FILL = 0.85;
/** Luminancia relativa de la corona (una sombra del color de la marca). */
export const CROWN_LUMINANCE = 0.004;
/** Alto de la corona bajo el remate del muro, en pisos dibujados. */
export const CROWN_LEVELS = 0.5;

/** Luminancia relativa (WCAG 2.x) de un color de three (componentes lineales). */
export const luminance = (c: Pick<Color, 'r' | 'g' | 'b'>): number => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;

/** Corona del resalte: el mismo tono que `mark`, oscurecido hasta CROWN_LUMINANCE. */
export function crownOf(mark: Color): Color {
  const l = luminance(mark);
  return l > 0 ? mark.clone().multiplyScalar(CROWN_LUMINANCE / l) : mark.clone();
}

/**
 * GLSL del resalte (necesita uLevel, vTop y vWorld). `mark` es 0 (nada), 1 (bajo el puntero) o 2
 * (elegido); `wy` = fwidth(vWorld.y), calculado fuera de ramas.
 */
export const HIGHLIGHT_GLSL = /* glsl */ `
uniform vec3 uHoverColor;
uniform vec3 uSelectColor;
uniform vec3 uHoverCrown;
uniform vec3 uSelectCrown;
vec3 highlight(vec3 color, float mark, vec3 N, float wy) {
  float chosen = step(1.5, mark);
  float marked = step(0.5, mark);
  float fill = mix(${HOVER_FILL.toFixed(2)}, ${SELECT_FILL.toFixed(2)}, chosen) * marked;
  float crownTop = ${CROWN_LEVELS.toFixed(2)} * uLevel;
  float band = 1.0 - smoothstep(crownTop - wy, crownTop + wy, vTop - vWorld.y);
  // Techo: solo cuerpo. Cara de adentro del pretil (de atrás): toda corona. Fachada: corona arriba.
  float crown = marked * (N.y > 0.5 ? 0.0 : (gl_FrontFacing ? band : 1.0));
  vec3 body = mix(color, mix(uHoverColor, uSelectColor, chosen), fill);
  return mix(body, mix(uHoverCrown, uSelectCrown, chosen), crown);
}
`;
