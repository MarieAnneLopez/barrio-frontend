import { Color } from 'three';
import { mapColor, type MapToken } from '../../lib/cssToken';
import { hash01 } from '../streets/hash';

// Colores de la vida del barrio, SOLO del tema de los mapas (styles/map-palette.css): carros (los
// taxis en el amarillo del sol, como en Bogotá), personitas de dos tonos al estilo del Messenger
// antiguo y aviones con sus luces de posición.

const read = (token: MapToken) => new Color(mapColor(token));

export interface VidaPalette {
  /** Carrocerías (se repite el amarillo: hay muchos taxis). */
  cars: Color[];
  /** Cuerpos de las personitas; la cabeza es el mismo tono, más claro. */
  people: Color[];
  vidrio: { day: Color; night: Color };
  farol: Color;
  freno: Color;
  avion: { day: Color; night: Color };
  ala: { day: Color; night: Color };
  babor: Color;
  estribor: Color;
  destello: Color;
}

export function readVidaPalette(): VidaPalette {
  const sol = read('ciclo-sol');
  return {
    cars: [sol, sol, sol, read('ciclo-nube'), read('dia-techo'), read('dia-agua'), read('dia-edificio-medio'),
      read('dia-edificio-alto'), read('via-borde'), read('fondo'), read('dia-edificio-bajo'), read('ciclo-nube')],
    people: [read('dia-parque'), read('dia-agua'), read('dia-edificio-bajo'), read('ciclo-atardecer'), read('dia-edificio-medio'), read('dia-cielo')],
    vidrio: { day: read('sombra'), night: read('fondo') },
    farol: read('ciclo-farol'),
    freno: read('ciclo-atardecer'),
    avion: { day: read('ciclo-nube'), night: read('contorno') },
    ala: { day: read('dia-techo'), night: read('via-borde') },
    babor: read('ciclo-atardecer'),
    estribor: read('ciclo-brillo-via'),
    destello: read('ciclo-estrella'),
  };
}

/** Color por instancia elegido de la lista con un hash fijo (rgb seguidos). */
export function instanceColors(count: number, list: readonly Color[], seed: number): Float32Array {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const c = list[Math.floor(hash01(i, seed) * list.length)] ?? list[0];
    if (c) out.set([c.r, c.g, c.b], 3 * i);
  }
  return out;
}
