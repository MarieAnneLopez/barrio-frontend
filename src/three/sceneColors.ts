// Colores de la escena desde la paleta del design system (ref. visual 1 de PLAN_MAESTRO).
import { Color } from 'three';
import { paletteColor } from '../lib/cssToken';

export interface SceneColors {
  ink: Color;
  navy: Color;
  sky: Color;
  cobalt: Color;
  azure: Color;
}

export function readSceneColors(): SceneColors {
  return {
    ink: new Color(paletteColor('ink')),
    navy: new Color(paletteColor('navy')),
    sky: new Color(paletteColor('sky')),
    cobalt: new Color(paletteColor('cobalt')),
    azure: new Color(paletteColor('azure')),
  };
}
