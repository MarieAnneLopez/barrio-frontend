// Colores de la maqueta 3D desde la paleta verde de los mapas (D82, styles/map-palette.css),
// por rol: maqueta clara y tranquila; la interfaz alrededor sigue en violeta.
import { Color } from 'three';
import { mapColor } from '../lib/cssToken';

export interface SceneColors {
  /** Cielo y niebla. */
  fondo: Color;
  /** Huella del barrio. */
  suelo: Color;
  /** Manzanas (zócalos bajos). */
  manzana: Color;
  /** Parques. */
  parque: Color;
  /** Base de los edificios. */
  edificio: Color;
  /** Remate alto de los edificios. */
  alto: Color;
  /** Aristas y partículas. */
  borde: Color;
  /** Vías. */
  via: Color;
  /** Filo de las vías principales. */
  filo: Color;
  /** Edificio elegido. */
  seleccion: Color;
}

export function readSceneColors(): SceneColors {
  return {
    fondo: new Color(mapColor('niebla')),
    suelo: new Color(mapColor('brote')),
    manzana: new Color(mapColor('follaje')),
    parque: new Color(mapColor('menta')),
    edificio: new Color(mapColor('follaje')),
    alto: new Color(mapColor('niebla')),
    borde: new Color(mapColor('hoja')),
    via: new Color(mapColor('via')),
    filo: new Color(mapColor('salvia')),
    seleccion: new Color(mapColor('salvia')),
  };
}
