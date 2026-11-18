import './sitting.css';
import { SequenceSprite } from '../../components/avatar/SequenceSprite';

/**
 * Mini Marie sentada (D82, pedido de Marie; D86; D88, pedido de Martín): arriba a la derecha del
 * mapa 3D, casi pegada a la esquina, con las piernas colgando y moviendo la pierna a 20 fps (ciclo
 * de 32 cuadros, sprites32; CSS steps, no toca el ciclo de la escena). En el Inicio y en Mapa 3D
 * (`stage`, los dos a pantalla completa y sin marco) se sienta en una repisa de 1 px bajo el header;
 * sin `stage`, en el borde superior de un recuadro.
 * Decorativa: sin eventos de puntero ni lector de pantalla. Movimiento reducido: primer cuadro quieto.
 */
export function SittingMarie({ stage = false }: { stage?: boolean }) {
  return (
    <span aria-hidden="true" data-mascot="sentada" className={`sitting-marie ${stage ? 'sitting-marie--stage' : ''}`}>
      {stage ? <span className="sitting-marie__ledge" /> : null}
      <SequenceSprite name="sit" size={48} pose={0} />
    </span>
  );
}
