import { act, render } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { stridePx } from '../loadingRun';
import { atlasCellWidth, sequenceSpec, spriteUrl } from '../sequences';
import { BarRunner, type BarRunnerHandle } from './BarRunner';
import { footShift, runnerFrame } from './runnerFrame';

const FRAMES = sequenceSpec('run').frames;
const STEP = stridePx(120) / FRAMES; // px de barra por cuadro a 120 px de alto (0,875)

describe('la Mini Marie de la barra de carga', () => {
  it('sin avance está en el primer cuadro y avanza uno por cada zancada / 32 recorrida', () => {
    expect(runnerFrame(0)).toBe(0);
    expect(runnerFrame(STEP * 1.01)).toBe(1);
    expect(runnerFrame(STEP * 5.5)).toBe(5);
  });

  it('da la vuelta al ciclo de 32 cuadros sin salirse de él', () => {
    expect(runnerFrame(STEP * (FRAMES + 2.5))).toBe(2);
    expect(runnerFrame(stridePx(120))).toBe(0); // una zancada exacta: el ciclo vuelve a empezar
    for (let px = 0; px <= 1024; px += 1) expect(runnerFrame(px)).toBeLessThan(FRAMES);
  });

  it('si la carga se detiene, ella se detiene: misma distancia, mismo cuadro', () => {
    expect(runnerFrame(187)).toBe(runnerFrame(187));
  });

  // Auditoría MM-09: el cuadro salía del porcentaje redondeado (5,12 px por 1 % en la barra de 512):
  // se saltaba cuadros y se deslizaba con la pose quieta. Ahora lo pone la barra en cada rAF.
  it('pone el cuadro que toca a esa distancia (columna y fila de la rejilla 8 × 4)', () => {
    const runner = createRef<BarRunnerHandle>();
    const { container } = render(<BarRunner ref={runner} atlas={210} />);
    act(() => runner.current?.travel(Math.ceil(STEP * 11))); // cuadro 11: columna 3, fila 1
    const [cols] = sequenceSpec('run').grid;
    const strip = container.querySelector<HTMLElement>('.sequence__strip');
    const rows = container.querySelector<HTMLElement>('.sequence__rows');
    expect(strip?.style.transform).toBe(`translateX(${-(11 % cols) * atlasCellWidth('run', 120)}px)`);
    expect(rows?.style.transform).toBe(`translateY(${-Math.floor(11 / cols) * 120}px)`);
    act(() => runner.current?.travel(STEP * 16));
    expect(container.querySelector<HTMLElement>('.bar-runner')?.style.transform).toBe(`translateX(${footShift(16)}px)`);
    expect(strip).toHaveAttribute('src', spriteUrl('run', 210)); // el mismo atlas que la Mini Marie grande (D111)
    expect(container.querySelectorAll('source')).toHaveLength(0);
  });

  it('con el atlas de 420 (pantalla grande o densa) también comparte ese archivo, sin fuentes propias', () => {
    const { container } = render(<BarRunner atlas={420} />);
    expect(container.querySelector('img')).toHaveAttribute('src', spriteUrl('run', 420));
    expect(container.querySelectorAll('source')).toHaveLength(0);
  });
});
