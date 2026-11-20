// Disco lunar y halo a distancia angular fija. La cúpula los dibuja siempre detrás del barrio.
export const MOON_GLSL = /* glsl */ `
vec3 moonlight(vec3 dir, vec3 lightDir) {
  float distanceToMoon = length(dir - lightDir);
  float glow = exp(-distanceToMoon * 54.0);
  float disc = 1.0 - smoothstep(0.005, 0.006, distanceToMoon);
  return vec3(0.61, 0.74, 0.99) * (glow * 0.14 + disc * 0.83);
}
`;
