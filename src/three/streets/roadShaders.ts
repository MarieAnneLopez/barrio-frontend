import { END_FRAGMENT, WORLD_VERTEX } from './shading';

// GLSL de calzada y andén (roadRibbons): las marcas se dibujan con la distancia al eje y a lo largo,
// sin geometría extra; de noche el borde brilla en cian (más en avenidas, D83) y por los carriles de
// las avenidas corren estelas de luz, como en la referencia.

export const ROAD_VERTEX = /* glsl */ `
  attribute vec4 aRoad;
  attribute vec4 aMeta;
  varying vec4 vRoad;
  varying vec4 vMeta;
  void main() {
    vRoad = aRoad;
    vMeta = aMeta;
    ${WORLD_VERTEX}
  }`;

const COMMON = /* glsl */ `
  varying vec4 vRoad;
  varying vec4 vMeta;
  uniform vec3 uDay;
  uniform vec3 uNightColor;
  uniform vec3 uGlow;
  const vec3 UP = vec3(0.0, 1.0, 0.0);
  float band(float d, float w) {
    float aa = fwidth(d) * 0.75 + 1e-4;
    return 1.0 - smoothstep(w * 0.5 - aa, w * 0.5 + aa, abs(d));
  }
  bool has(float style, float bit) { return mod(floor(style / bit), 2.0) > 0.5; }
  /** 0 dentro del cruce (las marcas y el brillo se apartan), 1 fuera. */
  float openness() { return smoothstep(0.0, 1.0, min(vMeta.z, vMeta.w)); }
`;

export const ASPHALT_FRAGMENT = /* glsl */ `
  uniform vec3 uLineDay;
  uniform vec3 uLineNight;
  uniform vec3 uYellowDay;
  uniform vec3 uYellowNight;
  uniform vec3 uTrail;
  ${COMMON}
  float dashes(float along, float period, float duty) {
    float f = fract(along / period);
    float aa = fwidth(along / period);
    float on = smoothstep(0.0, aa, f) * (1.0 - smoothstep(duty - aa, duty, f));
    return mix(on, duty, clamp(aa * 1.5 - 0.3, 0.0, 1.0));
  }
  void main() {
    float along = vRoad.x, across = vRoad.y, halfWidth = vRoad.z, lanes = max(vRoad.w, 1.0);
    float style = vMeta.x, glow = vMeta.y, open = openness();
    float laneWidth = 2.0 * halfWidth / lanes;
    float k = (across + halfWidth) / laneWidth;
    float white = 0.0, yellow = 0.0;
    if (has(style, 1.0) && k > 0.5 && k < lanes - 0.5) white = band((fract(k + 0.5) - 0.5) * laneWidth, 0.3) * dashes(along, 9.0, 0.4);
    if (has(style, 2.0)) yellow = band(across, 0.3) * dashes(along, 8.0, 0.5);
    if (has(style, 4.0)) yellow = max(band(across - 0.22, 0.18), band(across + 0.22, 0.18));
    if (has(style, 8.0)) white = max(white, band(halfWidth - abs(across) - 0.6, 0.25));
    vec3 color = shade(uDay, uNightColor, UP);
    color = mix(color, shade(uLineDay, uLineNight, UP), white * open);
    color = mix(color, shade(uYellowDay, uYellowNight, UP), yellow * open);
    // Noche: neón en el borde y estelas que avanzan en el sentido de cada carril.
    float neon = exp(-(halfWidth - abs(across)) * 3.2) * glow * open * uNight;
    float lane = (fract(k) - 0.5) * laneWidth;
    bool oneWay = has(style, 1.0) || (!has(style, 2.0) && !has(style, 4.0));
    float dir = oneWay ? (has(style, 16.0) ? -1.0 : 1.0) : sign(across);
    float flow = fract((along - dir * uTime * 16.0) / 34.0);
    float trail = band(lane, 0.55) * step(0.55, glow) * open * uNight * (0.25 + 0.75 * flow * flow);
    color += uGlow * neon * 1.8 + mix(uTrail, uGlow, step(0.0, across)) * trail * 0.8;
    gl_FragColor = vec4(color, 1.0);
    ${END_FRAGMENT}
  }`;

export const SIDEWALK_FRAGMENT = /* glsl */ `
  ${COMMON}
  void main() {
    float beyond = abs(vRoad.y) - vRoad.z;
    float open = openness(); // 0 en la esquina con una calle igual o mayor (roadRibbons.SIDEWALK_CORNER)
    vec3 color = shade(uDay, uNightColor, UP);
    color *= 1.0 - 0.28 * band(beyond - 0.15, 0.3) * open; // bordillo
    color += uGlow * exp(-max(beyond, 0.0) * 3.0) * vMeta.y * open * uNight * 1.4;
    gl_FragColor = vec4(color, 1.0);
    ${END_FRAGMENT}
  }`;
