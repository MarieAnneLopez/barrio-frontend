import { Color, DoubleSide, ShaderMaterial, UniformsLib, UniformsUtils } from 'three';
import { mapColor, type MapToken } from '../../lib/cssToken';
import { LIGHT } from '../sky/lightUniforms';
import { BUILDINGS_FRAGMENT } from './shaderFragment';
import { BUILDINGS_VERTEX } from './shaderVertex';
import { LEVEL_HEIGHT, PARAPET } from './volume';

/** Ningún edificio bajo el puntero o elegido. */
export const NO_BUILDING = -1;

const color = (token: MapToken) => new Color(mapColor(token));

/**
 * Material de los edificios (un solo programa para todas las teselas). Colores solo del tema de los
 * mapas (map-palette.css, D83/D106): de día los muros por clase de altura y el techo; de noche los
 * roles medidos en la referencia. Vidrio = sombra; ventanas encendidas = ciclo-ventana (y farol);
 * bajo el puntero = sol (el amarillo de la interfaz) y elegido = atardecer (el rosa de la selección).
 * Los uniformes de luz son los compartidos (LIGHT, por referencia); la niebla, la de la escena.
 * Doble cara: la de atrás de los muros, sobre el techo hundido, es el pretil.
 */
export function createBuildingMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    name: 'edificios',
    uniforms: {
      ...LIGHT,
      ...UniformsUtils.clone(UniformsLib.fog),
      uWall: { value: [color('dia-edificio-bajo'), color('dia-edificio-medio'), color('dia-edificio-alto')] },
      uWallNight: { value: [color('edificio-bajo'), color('edificio-medio'), color('edificio-alto')] },
      uRoof: { value: color('dia-techo') },
      uRoofNight: { value: color('manzana') },
      uTrim: { value: color('dia-edificio-alto') },
      uTrimNight: { value: color('contorno') },
      uGlass: { value: color('sombra') },
      uLamp: { value: color('ciclo-ventana') },
      uLampSoft: { value: color('ciclo-farol') },
      uHoverColor: { value: color('ciclo-sol') },
      uSelectColor: { value: color('ciclo-atardecer') },
      uLevel: { value: LEVEL_HEIGHT },
      uParapet: { value: PARAPET },
      uHover: { value: NO_BUILDING },
      uSelected: { value: NO_BUILDING },
    },
    vertexShader: BUILDINGS_VERTEX,
    fragmentShader: BUILDINGS_FRAGMENT,
    fog: true,
    side: DoubleSide,
  });
}
