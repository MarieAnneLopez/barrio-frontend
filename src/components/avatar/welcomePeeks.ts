// Las 8 Mini Marie de la bienvenida (D82; gran actualización): 4 en las esquinas exactas y 4 en el
// centro exacto de cada borde, de cabeza hacia el centro de la pantalla. Posiciones FIJAS: ya no se
// deslizan por el borde cuando algo les estorba; van en una capa por encima de todo mientras dura
// la bienvenida. Funciones puras: dónde va cada una y cuánto se ve.

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
export interface Placement { x: number; y: number; rotation: number }

/** Ancla exacta de cada ranura: la esquina o el centro del borde de la pantalla visible. */
export function anchorOf(slot: PeekSlot, { w, h }: Size): [number, number] {
  const x = slot.endsWith('l') || slot === 'left' ? 0 : slot.endsWith('r') || slot === 'right' ? w : w / 2;
  const y = slot.startsWith('t') ? 0 : slot.startsWith('b') ? h : h / 2;
  return [x, y];
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

/** Centro de una caja. */
export const centerOf = (box: Rect): { x: number; y: number } =>
  ({ x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 });

/** Las 8, cada una en su ancla exacta con el giro de su ranura. Nada las corre. */
export function placePeeks(view: Size): Record<PeekSlot, Placement> {
  const entries = SLOTS.map((slot) => {
    const [x, y] = anchorOf(slot, view);
    return [slot, { x, y, rotation: ROTATION[slot] }] as const;
  });
  return Object.fromEntries(entries) as Record<PeekSlot, Placement>;
}
