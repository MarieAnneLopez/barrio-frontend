import './bar-runner.css';
import { SequenceSprite } from '../SequenceSprite';
import { BAR_RUNNER_SIZE, barWidth, runnerFrame } from './runnerFrame';

/**
 * La Mini Marie pequeña que corre con la punta de la barra (gran actualización): avanza con el
 * porcentaje real y cada cuadro sale de la distancia recorrida, así no corre en el sitio ni patina;
 * si la carga se detiene, ella se detiene. Va detrás de la punta, lejos de las chispas amarillas
 * (Mini Marie nunca sobre amarillo). Con movimiento reducido, su cuadro dibujado, quieto.
 */
export function BarRunner({ shown }: { shown: number }) {
  return (
    <span className="bar-runner">
      <SequenceSprite name="run" size={BAR_RUNNER_SIZE} playing={false} pose={3} frame={runnerFrame(shown, barWidth())} />
    </span>
  );
}
