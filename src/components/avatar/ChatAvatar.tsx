import { sequenceSpec } from './sequences';
import { SequenceSprite } from './SequenceSprite';

interface Props {
  /** Diámetro del círculo en px. */
  size: number;
}

/** Fracción de la altura del cuadro que se ve: cabeza, hombros y la mano que saluda. */
const VISIBLE = 0.6;
/** La mano que saluda está a la derecha de la cabeza: se corre un poco el encuadre hacia ella. */
const SHIFT = 0.1;

/**
 * Avatar del chat (pedido de Marie): Mini Marie saludando como foto de perfil, recortada
 * en un círculo y animada con los cuadros del saludo. No camina ni corre: la animación
 * de carga es aparte (LoadingScreen). Movimiento reducido: pose fija con la mano arriba.
 */
export function ChatAvatar({ size }: Props) {
  const spec = sequenceSpec('wave');
  const height = Math.round(size / VISIBLE);
  const width = Math.round((height * spec.width) / spec.height);
  return (
    <span
      aria-hidden="true"
      className="chat-avatar relative inline-block shrink-0 overflow-hidden rounded-full border-2 border-ink bg-pink"
      style={{ width: size, height: size }}
    >
      <span className="absolute top-[2%]" style={{ left: Math.round((size - width) / 2 - width * SHIFT) }}>
        <SequenceSprite name="wave" height={height} pose={2} />
      </span>
    </span>
  );
}
