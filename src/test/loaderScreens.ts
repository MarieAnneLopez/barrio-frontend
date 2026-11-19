import { SIZES, spriteUrl } from '../components/avatar/sequences';

export interface Screen { w: number; h: number; dppx: number }

/**
 * El atlas que debe pintar la pantalla de carga (D111, auditoría MM-01), escrito aparte del código:
 * el menor que cubra el alto de la Mini Marie grande (420 si la pantalla da para ese alto; si no,
 * 210) por la densidad, con los umbrales de SequenceSprite (doble por encima de 1,01 dppx, cuádruple
 * por encima de 2,01); si ninguno alcanza, el mayor. Las dos Mini Marie de la carga comparten ese archivo.
 */
export function painted({ w, h, dppx }: Screen): string {
  const size = w >= 640 && h >= 860 ? 420 : 210;
  const times = dppx >= 2.01 ? 4 : dppx >= 1.01 ? 2 : 1;
  return spriteUrl('run', SIZES.run.find((atlas) => atlas >= size * times) ?? 420);
}
