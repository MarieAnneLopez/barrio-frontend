// Cortinas tenues en coordenadas celestes y un asteroide lejano cada 76 segundos visibles.
export const ATMOSPHERE_GLSL = /* glsl */ `
vec3 aurora(vec3 dir, float t, float detail) {
  vec2 p = vec2(atan(dir.x, dir.z), dir.y);
  float fold = sin(4.0 * p.x + t * 0.035) * 0.045 + sin(11.0 * p.x - t * 0.021) * 0.012;
  float latitude = abs(p.y);
  float band = fract((latitude + fold) * 3.3 + 0.12);
  float curtain = smoothstep(0.18, 0.27, band) * exp(-max(band - 0.27, 0.0) * 9.0);
  float rays = 0.74 + detail * 0.18 * sin(p.x * 92.0 + sin(p.x * 15.0) + t * 0.06);
  vec3 tint = mix(vec3(0.025, 0.24, 0.19), vec3(0.16, 0.07, 0.24), band);
  return tint * curtain * rays * 0.50;
}

vec3 asteroid(vec2 screen, float aspect, float t) {
  float pass = mod(t + 61.0, 76.0);
  if (pass > 6.0) return vec3(0.0);
  float lane = fract(floor((t + 61.0) / 76.0) * 0.618 + 0.31);
  vec2 travel = vec2(mix(-1.08, 1.08, pass / 6.0), mix(0.3, 0.83, lane) - pass * 0.045);
  vec2 p = (screen - travel) * vec2(aspect, 1.0);
  float angle = atan(p.y, p.x) + pass * 0.35;
  float edge = 0.0036 * (1.0 + 0.17 * sin(angle * 3.0) + 0.11 * cos(angle * 5.0));
  float rock = 1.0 - smoothstep(edge - 0.0007, edge + 0.0007, length(p));
  float rim = clamp(0.47 + dot(p / 0.004, vec2(-0.43, 0.65)), 0.12, 1.0);
  return vec3(0.55, 0.53, 0.69) * rock * rim;
}
`;
