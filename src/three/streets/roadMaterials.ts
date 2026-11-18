import type { ShaderMaterial } from 'three';
import type { StreetPalette } from './palette';
import { ASPHALT_FRAGMENT, ROAD_VERTEX, SIDEWALK_FRAGMENT } from './roadShaders';
import { litMaterial } from './shading';

// Materiales de calzada y andén con los colores del tema de los mapas (palette.ts).

const u = <T>(value: T) => ({ value });

export function asphaltMaterial(p: StreetPalette): ShaderMaterial {
  return litMaterial({
    vertex: ROAD_VERTEX,
    fragment: ASPHALT_FRAGMENT,
    uniforms: {
      uDay: u(p.asfalto.day), uNightColor: u(p.asfalto.night), uLineDay: u(p.linea.day), uLineNight: u(p.linea.night),
      uYellowDay: u(p.amarillo.day), uYellowNight: u(p.amarillo.night), uGlow: u(p.brillo), uTrail: u(p.estela),
    },
  });
}

export function sidewalkMaterial(p: StreetPalette): ShaderMaterial {
  return litMaterial({
    vertex: ROAD_VERTEX,
    fragment: SIDEWALK_FRAGMENT,
    uniforms: { uDay: u(p.anden.day), uNightColor: u(p.anden.night), uGlow: u(p.brillo) },
  });
}
