import { Color, DoubleSide, ShaderMaterial, UniformsLib, UniformsUtils } from 'three';
import { mapColor, type MapToken } from '../../lib/cssToken';
import { LIGHT } from '../sky/lightUniforms';
import { crownOf } from './highlight';
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
 * bajo el puntero = sol (el amarillo de la interfaz) y elegido = atardecer (el rosa de la selección),
 * con su corona en una sombra del mismo tono (highlight.ts).
 * Los uniformes de luz son los compartidos (LIGHT, por referencia); la niebla, la de la escena.
 * Doble cara: la de atrás de los muros, sobre el techo hundido, es el pretil, y toma la rama barata
 * del fragmento (sin ventanas, cuadrícula de pisos ni reflejos). Con FrontSide y una banda propia
 * por tramo de muro, los datos reales suman 231 184 triángulos (+67 %) y hasta 324 650 vértices
 * (+68 %; tres teselas pasan de índices de 16 bits), y tras descartar caras se rasterizan casi
 * tantos triángulos como ahora.
 */
export function createBuildingMaterial(): ShaderMaterial {
  const [hover, select] = [color('ciclo-sol'), color('ciclo-atardecer')];
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
      uHoverColor: { value: hover },
      uSelectColor: { value: select },
      uHoverCrown: { value: crownOf(hover) },
      uSelectCrown: { value: crownOf(select) },
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
