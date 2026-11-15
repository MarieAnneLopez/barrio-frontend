// Colores de la escena 3D desde la paleta v2 (docs/DISENO-V2.md §9), por rol.
import { Color } from 'three';
import { paletteColor } from '../lib/cssToken';

export interface SceneColors {
  /** Fondo y niebla. */
  fondo: Color;
  /** Suelo y base de los edificios. */
  base: Color;
  /** Bordes, luces y partículas. */
  linea: Color;
  /** Remate alto de los edificios. */
  alto: Color;
  /** Realces: parques, vías y selección. */
  realce: Color;
}

export function readSceneColors(): SceneColors {
  return {
    fondo: new Color(paletteColor('vino')),
    base: new Color(paletteColor('ladrillo')),
    linea: new Color(paletteColor('piedra')),
    alto: new Color(paletteColor('rosa')),
    realce: new Color(paletteColor('rosa')),
  };
}
