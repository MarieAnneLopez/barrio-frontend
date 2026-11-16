import './sitting.css';
import { SequenceSprite } from '../../components/avatar/SequenceSprite';

/**
 * Mini Marie sentada (D82, pedido de Marie; D86; D88, pedido de Martín): sobre el borde superior
 * del recuadro del mapa 3D, casi pegada a la esquina derecha, con las piernas hacia el mapa y
 * moviendo la pierna a 8 fps (CSS steps; no toca el ciclo de la escena). Solo en Inicio y Mapa 3D,
 * las dos páginas con HeroSection. Decorativa: sin eventos de puntero ni lector de pantalla.
 * Movimiento reducido: primer cuadro quieto.
 */
export function SittingMarie() {
  return (
    <span aria-hidden="true" data-mascot="sentada" className="sitting-marie">
      <SequenceSprite name="sit" size={48} pose={0} />
    </span>
  );
}
