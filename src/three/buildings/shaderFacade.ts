import { MEDIUM_FROM } from './volume';

// Fachada (GLSL): muro con ventanas en filas por piso y columnas cada ~3 m, cornisa en el remate,
// sombra bajo la cornisa, losas de entrepiso en los edificios de 4 pisos o más y oscurecimiento al
// pie. De día el vidrio es oscuro y refleja el cielo (uZenith) con un brillo del sol; de noche las
// ventanas se encienden al azar (windowLit). Lejos, el patrón se funde en su promedio (sin moiré).
// Las medianeras (columna −1) son ciegas: sin ventanas, un poco más oscuras.
export const FACADE_GLSL = /* glsl */ `
float band(float v, float a, float b, float w) {
  return smoothstep(a - w, a + w, v) - smoothstep(b - w, b + w, v);
}
vec3 facade(vec3 wall, vec3 trim, vec3 N, float building, float floors) {
  float level = vWorld.y / uLevel;
  float row = floor(level);
  vec2 cell = vec2(vColumn, level);
  vec2 f = fract(cell);
  vec2 w = max(fwidth(cell), vec2(1e-4));
  float detail = 1.0 - smoothstep(0.3, 0.65, max(w.x, w.y));
  float blind = step(vColumn, -0.5);
  float ground = 1.0 - step(0.5, row);
  float glazed = band(f.x, 0.22, 0.78, w.x) * band(f.y, mix(0.3, 0.1, ground), 0.74, w.y);
  float panes = (1.0 - blind) * mix(0.23, glazed, detail);
  float down = vTop - vWorld.y;
  float wy = max(fwidth(vWorld.y), 1e-3);
  float cornice = 1.0 - smoothstep(uParapet - wy, uParapet + wy, down);
  float drip = band(down, uParapet, uParapet + 0.45, wy) * (1.0 - blind);
  float slab = step(${MEDIUM_FROM.toFixed(1)} - 0.5, floors) * band(f.y, -0.02, 0.07, w.y) * detail * (1.0 - blind);
  vec3 base = mix(wall * (1.0 - 0.14 * blind), trim, max(cornice, 0.6 * slab)) * (1.0 - 0.3 * drip);
  base *= mix(0.7, 1.0, smoothstep(0.0, 1.4 * uLevel, vWorld.y));
  vec3 V = normalize(cameraPosition - vWorld);
  float fresnel = pow(1.0 - abs(dot(N, V)), 3.0);
  vec3 glass = lit(mix(uGlass, uZenith, 0.25 + 0.55 * fresnel), N);
  glass += uLightColor * pow(max(dot(reflect(-V, N), uLightDir), 0.0), 40.0) * 0.5;
  float column = max(floor(vColumn), 0.0);
  float on = mix(litFraction(uNight), windowLit(building, row, column, uNight), detail);
  float tint = hash01(building, row + 101.0, column);
  vec3 lamp = mix(uLamp, uLampSoft, step(0.72, tint)) * (0.8 + 0.4 * tint);
  return mix(lit(base, N), mix(glass, lamp, on), panes * (1.0 - cornice));
}
`;
