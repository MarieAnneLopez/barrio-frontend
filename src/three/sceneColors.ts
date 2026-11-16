// Colores de la maqueta 3D desde el tema único de los mapas (D83, styles/map-palette.css), por rol.
// Son los hex medidos en la referencia; la interfaz alrededor sigue en violeta.
import { Color } from 'three';
import { mapColor, type MapToken } from '../lib/cssToken';

export interface SceneColors {
  /** Cielo, niebla y alrededor del barrio. */
  fondo: Color;
  suelo: Color;
  manzana: Color;
  lote: Color;
  parque: Color;
  via: Color;
  /** Borde de las vías principales y senderos. */
  viaBorde: Color;
  /** Techos por altura: hasta 3 pisos, de 4 a 6 y de 7 o más. */
  edificio: readonly [Color, Color, Color];
  /** Caras en sombra. */
  sombra: Color;
  /** Aristas, partículas y edificio elegido. */
  contorno: Color;
}

const read = (token: MapToken) => new Color(mapColor(token));

export function readSceneColors(): SceneColors {
  return {
    fondo: read('fondo'),
    suelo: read('suelo'),
    manzana: read('manzana'),
    lote: read('lote'),
    parque: read('parque'),
    via: read('via'),
    viaBorde: read('via-borde'),
    edificio: [read('edificio-bajo'), read('edificio-medio'), read('edificio-alto')],
    sombra: read('sombra'),
    contorno: read('contorno'),
  };
}

/** Clase de altura de un edificio: 0 = hasta 3 pisos, 1 = de 4 a 6, 2 = 7 o más. */
export function heightClass(levels: number): 0 | 1 | 2 {
  return levels >= 7 ? 2 : levels >= 4 ? 1 : 0;
}
