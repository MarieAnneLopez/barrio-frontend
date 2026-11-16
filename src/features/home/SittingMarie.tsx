import './sitting.css';
import { SequenceSprite } from '../../components/avatar/SequenceSprite';

/**
 * Mini Marie sentada (D82, pedido de Marie): sobre el borde superior del recuadro del mapa 3D,
 * en la esquina derecha, con las piernas hacia el mapa, moviendo la pierna con sus 8 cuadros a
 * 8 fps (CSS steps; no toca el ciclo de la escena). Solo en Inicio y Mapa 3D, las dos páginas con
 * HeroSection. Decorativa: sin eventos de puntero ni lector de pantalla. Movimiento reducido:
 * primer cuadro quieto.
 */
export function SittingMarie() {
  return (
    <span aria-hidden="true" data-mascot="sentada" className="sitting-marie">
      <SequenceSprite name="sit" height="var(--sit-h)" pose={0} />
    </span>
  );
}
