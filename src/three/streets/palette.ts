import { Color } from 'three';
import { mapColor, type MapToken } from '../../lib/cssToken';
import type { GroundPalette } from './groundAreas';
import type { DayNight } from './sink';

// Colores de calles y vida, SOLO del tema de los mapas (styles/map-palette.css, D83 y D106). De día,
// los `--map-dia-*`; de noche, los 8 medidos en la referencia, que es nocturna: asfalto gris oscuro
// (`via-borde`) y andenes claros (`via`), como en ella. Algunos tonos se derivan aquí mezclando u
// oscureciendo tokens (sin hex sueltos); cada uno dice de cuáles sale.

const read = (token: MapToken) => new Color(mapColor(token));
const pair = (day: MapToken, night: MapToken): DayNight => ({ day: read(day), night: read(night) });
/** Mismo token de día; de noche, el mismo tono más oscuro (las cosas sin luz propia). */
const dimmed = (token: MapToken, night: number): DayNight => ({ day: read(token), night: read(token).multiplyScalar(night) });

export interface StreetPalette extends GroundPalette {
  asfalto: DayNight;
  anden: DayNight;
  ciclo: DayNight;
  tierra: DayNight;
  concreto: DayNight;
  linea: DayNight;
  amarillo: DayNight;
  /** Postes y brazos; cajas oscuras (semáforos, vidrios). */
  metal: DayNight;
  oscuro: DayNight;
  /** Brillo de las vías de noche (cian de la referencia) y estela cálida de los faros. */
  brillo: Color;
  estela: Color;
  /** Luces: farol y semáforo (alto en el rosa, atención en el amarillo y siga en el cian del tema). */
  farol: Color;
  alto: Color;
  atencion: Color;
}

export function readStreetPalette(): StreetPalette {
  const verde = pair('dia-parque', 'parque');
  return {
    barrio: pair('dia-suelo', 'suelo'),
    verde,
    // Grama sintética: el verde del parque con un toque del amarillo del sol (día) y del contorno (noche).
    cancha: { day: verde.day.clone().lerp(read('ciclo-sol'), 0.18), night: verde.night.clone().lerp(read('contorno'), 0.12) },
    juegos: pair('dia-via-borde', 'via'),
    pista: dimmed('ciclo-tierra', 0.5),
    agua: pair('dia-agua', 'agua'),
    asfalto: pair('dia-via', 'via-borde'),
    anden: pair('dia-via-borde', 'via'),
    ciclo: dimmed('ciclo-tierra', 0.55),
    tierra: pair('dia-techo', 'via-borde'),
    concreto: pair('dia-manzana', 'via-borde'),
    linea: pair('ciclo-nube', 'contorno'),
    amarillo: dimmed('ciclo-sol', 0.55),
    metal: pair('dia-techo', 'via-borde'),
    oscuro: pair('sombra', 'fondo'),
    brillo: read('ciclo-brillo-via'),
    estela: read('ciclo-farol'),
    farol: read('ciclo-farol'),
    alto: read('ciclo-atardecer'),
    atencion: read('ciclo-sol'),
  };
}
