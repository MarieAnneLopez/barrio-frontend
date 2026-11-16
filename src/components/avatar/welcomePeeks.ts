// Las 8 Mini Marie de la bienvenida (D82, pedido de Marie): 4 esquinas y el centro de cada
// borde, de cabeza hacia adentro. Funciones puras: dónde va cada una y cuánto se ve.

export type PeekSlot = 'tl' | 'top' | 'tr' | 'right' | 'br' | 'bottom' | 'bl' | 'left';
export const SLOTS: readonly PeekSlot[] = ['tl', 'top', 'tr', 'right', 'br', 'bottom', 'bl', 'left'];

/** Giro de cada una (grados, como CSS rotate): la cabeza apunta al centro de la pantalla. */
export const ROTATION: Record<PeekSlot, number> = {
  tl: 135, top: 180, tr: -135, right: -90, br: -45, bottom: 0, bl: 45, left: 90,
};
/** Fracción de su altura que asoma: cabeza, hombros y la mano que saluda. */
export const VISIBLE = 0.46;

export interface Rect { left: number; top: number; right: number; bottom: number }
export interface Size { w: number; h: number }
/** rotation: la de su ranura; si una de esquina se corre por un borde, toma la de ese borde. */
export interface Placement { x: number; y: number; shifted: number; rotation: number }

function anchor(slot: PeekSlot, { w, h }: Size): [number, number] {
  const x = slot.endsWith('l') || slot === 'left' ? 0 : slot.endsWith('r') || slot === 'right' ? w : w / 2;
  const y = slot.startsWith('t') ? 0 : slot.startsWith('b') ? h : h / 2;
  return [x, y];
}

/** Hacia dónde se desliza por su borde si choca (las de esquina, por uno de sus dos bordes). */
function along(slot: PeekSlot): [number, number] {
  if (slot === 'top' || slot === 'bottom') return [1, 0];
  if (slot === 'left' || slot === 'right') return [0, 1];
  return [slot.endsWith('l') ? 1 : -1, 0];
}

/** Caja visible (dentro de la pantalla) de una Mini Marie anclada en (x, y); null si no asoma. */
export function visibleBox(rotation: number, x: number, y: number, sprite: Size, view: Size): Rect | null {
  const rad = (rotation * Math.PI) / 180;
  const [cos, sin] = [Math.cos(rad), Math.sin(rad)];
  const v = sprite.h * VISIBLE;
  const corners = [[-sprite.w / 2, -v], [sprite.w / 2, -v], [-sprite.w / 2, 0], [sprite.w / 2, 0]] as const;
  const xs = corners.map(([cx, cy]) => x + cx * cos - cy * sin);
  const ys = corners.map(([cx, cy]) => y + cx * sin + cy * cos);
  const box = {
    left: Math.max(0, Math.min(...xs)), right: Math.min(view.w, Math.max(...xs)),
    top: Math.max(0, Math.min(...ys)), bottom: Math.min(view.h, Math.max(...ys)),
  };
  return box.right > box.left && box.bottom > box.top ? box : null;
}

const GAP = 8;
const hits = (a: Rect, b: Rect) =>
  a.left < b.right + GAP && b.left < a.right + GAP && a.top < b.bottom + GAP && b.top < a.bottom + GAP;

/** Coloca las 8 sin tapar obstáculos (letrero, botones, chat) ni a las demás; si chocan, se deslizan. */
export function placePeeks(view: Size, sprite: Size, obstacles: readonly Rect[]): Record<PeekSlot, Placement> {
  const taken: Rect[] = [];
  const result = {} as Record<PeekSlot, Placement>;
  for (const slot of SLOTS) {
    const [ax, ay] = anchor(slot, view);
    const [dx, dy] = along(slot);
    const limit = Math.max(view.w, view.h) / 2;
    const corner = slot.length === 2;
    const turn = (s: number) => (corner && s !== 0 ? (slot.startsWith('t') ? 180 : 0) : ROTATION[slot]);
    let chosen: Placement = { x: ax, y: ay, shifted: 0, rotation: ROTATION[slot] };
    for (let d = 0; d <= limit; d += 8) {
      const tries = corner ? [d] : [d, -d]; // la de esquina solo entra hacia la pantalla
      const free = tries.find((s) => {
        const box = visibleBox(turn(s), ax + dx * s, ay + dy * s, sprite, view);
        return box && ![...obstacles, ...taken].some((o) => hits(box, o));
      });
      if (free !== undefined) {
        chosen = { x: ax + dx * free, y: ay + dy * free, shifted: free, rotation: turn(free) };
        break;
      }
    }
    const box = visibleBox(chosen.rotation, chosen.x, chosen.y, sprite, view);
    if (box) taken.push(box);
    result[slot] = chosen;
  }
  return result;
}
