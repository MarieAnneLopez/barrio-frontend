import './bar-runner.css';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { frameTransforms, type SpriteSize } from '../sequences';
import { SequenceSprite } from '../SequenceSprite';
import { BAR_RUNNER_SIZE, footShift, runnerFrame } from './runnerFrame';

export interface BarRunnerHandle {
  /** Pone el cuadro que toca a `px` de recorrido de la punta. Lo llama la barra en cada rAF. */
  travel: (px: number) => void;
}

/**
 * La Mini Marie pequeña que corre con la punta de la barra (gran actualización): avanza con el
 * porcentaje real y cada cuadro sale de la distancia recorrida, así no corre en el sitio ni patina;
 * si la carga se detiene, ella se detiene. La barra le da su posición en cada rAF (travel) y ella pone
 * el cuadro directamente, igual que la barra mueve el riel: sin esperar a un render (auditoría MM-09).
 * Va detrás de la punta, lejos de las chispas amarillas (Mini Marie nunca sobre amarillo). Con
 * movimiento reducido, su cuadro dibujado, quieto (la barra no la mueve). Usa el atlas de la grande
 * (D111): una sola descarga, que siempre reduce (bar-runner.css lo suaviza).
 */
export const BarRunner = forwardRef<BarRunnerHandle, { atlas: SpriteSize<'run'> }>(function BarRunner({ atlas }, ref) {
  const box = useRef<HTMLSpanElement>(null);
  useImperativeHandle(ref, () => ({
    travel(px: number) {
      const frame = runnerFrame(px);
      const { across, down } = frameTransforms('run', BAR_RUNNER_SIZE, frame);
      if (box.current) box.current.style.transform = `translateX(${footShift(frame)}px)`;
      const strip = box.current?.querySelector<HTMLElement>('.sequence__strip');
      const rows = box.current?.querySelector<HTMLElement>('.sequence__rows');
      if (strip) strip.style.transform = across;
      if (rows) rows.style.transform = down;
    },
  }), []);
  return (
    <span ref={box} className="bar-runner" style={{ transform: `translateX(${footShift(0)}px)` }}>
      <SequenceSprite name="run" size={BAR_RUNNER_SIZE} atlas={atlas} playing={false} pose={3} frame={0} />
    </span>
  );
});
