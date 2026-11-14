// Colocación de cada pose de Mini Marie con la línea base común del atlas (D15):
// los pies de todas las poses caen en el mismo punto; jump conserva su altura.
import atlas from './atlas.json';

export interface FramePlacement {
  file: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface AvatarLayout {
  width: number;
  height: number;
  frames: Record<number, FramePlacement>;
}

const FRAMES = atlas.frames;
const ABOVE = Math.max(...FRAMES.map((f) => f.footY + f.offsetY)); // del suelo a la cima
const LEFT = Math.max(...FRAMES.map((f) => f.footX));
const RIGHT = Math.max(...FRAMES.map((f) => f.w - f.footX));

/** Medidas en px para que el avatar mida `height` px desde el suelo a la cima. */
export function avatarLayout(height: number): AvatarLayout {
  const scale = height / ABOVE;
  const frames: Record<number, FramePlacement> = {};
  FRAMES.forEach((frame, i) => {
    frames[i + 1] = {
      file: `/assets/avatar/${frame.file}`,
      left: (LEFT - frame.footX) * scale,
      top: (ABOVE - frame.footY - frame.offsetY) * scale,
      width: frame.w * scale,
      height: frame.h * scale,
    };
  });
  return { width: (LEFT + RIGHT) * scale, height, frames };
}
