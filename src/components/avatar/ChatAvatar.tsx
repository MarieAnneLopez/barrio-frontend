import { cellWidth } from './sequences';
import { SequenceSprite } from './SequenceSprite';

interface Props {
  /** Diámetro del círculo en px. */
  size: number;
}

/** Alto fijo del sprite (escala entera, D86): en un círculo de 48 px se ve el 60 % de arriba. */
const SPRITE = 80;
/** La mano que saluda está a la derecha de la cabeza: se corre un poco el encuadre hacia ella. */
const SHIFT = 0.1;

/**
 * Avatar del chat (pedido de Marie): Mini Marie saludando como foto de perfil, recortada
 * en un círculo papel con una línea de 1 px y animada con los cuadros del saludo. No camina ni corre: la animación
 * de carga es aparte (LoadingScreen). Movimiento reducido: pose fija con la mano arriba.
 */
export function ChatAvatar({ size }: Props) {
  const width = cellWidth('wave', SPRITE);
  return (
    <span
      aria-hidden="true"
      className="chat-avatar relative inline-block shrink-0 overflow-hidden rounded-full border border-ink bg-pink"
      style={{ width: size, height: size }}
    >
      <span className="absolute" style={{ top: 1, left: Math.round((size - width) / 2 - width * SHIFT) }}>
        <SequenceSprite name="wave" size={SPRITE} pose={2} />
      </span>
    </span>
  );
}
