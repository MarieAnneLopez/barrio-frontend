import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { stridePx } from '../loadingRun';
import { atlasCellWidth, sequenceSpec, spriteUrl } from '../sequences';
import { BarRunner } from './BarRunner';
import { runnerFrame } from './runnerFrame';

const FRAMES = sequenceSpec('run').frames;
const STEP = stridePx(105) / FRAMES; // px de barra por cuadro a 105 px de alto

describe('la Mini Marie de la barra de carga', () => {
  it('sin avance está en el primer cuadro y avanza uno por cada zancada / 32 recorrida', () => {
    expect(runnerFrame(0, 400)).toBe(0);
    expect(runnerFrame((STEP * 1.01) / 400, 400)).toBe(1);
    expect(runnerFrame((STEP * 5.5) / 400, 400)).toBe(5);
  });

  it('da la vuelta al ciclo de 32 cuadros sin salirse de él', () => {
    expect(runnerFrame((STEP * (FRAMES + 2.5)) / 400, 400)).toBe(2);
    for (let shown = 0; shown <= 1; shown += 0.01) {
      const frame = runnerFrame(shown, 512);
      expect(frame).toBeGreaterThanOrEqual(0);
      expect(frame).toBeLessThan(FRAMES);
    }
  });

  it('si la carga se detiene, ella se detiene: mismo avance, mismo cuadro', () => {
    expect(runnerFrame(0.37, 420)).toBe(runnerFrame(0.37, 420));
  });

  it('muestra en el atlas el cuadro que toca (columna y fila de la rejilla 8 × 4)', () => {
    const shown = (STEP * 11.2) / 420; // cuadro 11: columna 3, fila 1
    Object.assign(window, { innerWidth: 420 / 0.82 });
    const { container } = render(<BarRunner shown={shown} atlas={210} />);
    const [cols] = sequenceSpec('run').grid;
    const strip = container.querySelector<HTMLElement>('.sequence__strip');
    const rows = container.querySelector<HTMLElement>('.sequence__rows');
    expect(strip?.style.transform).toBe(`translateX(${-(11 % cols) * atlasCellWidth('run', 105)}px)`);
    expect(rows?.style.transform).toBe(`translateY(${-Math.floor(11 / cols) * 105}px)`);
    expect(strip).toHaveAttribute('src', spriteUrl('run', 210)); // el mismo atlas que la Mini Marie grande (D111)
    expect(container.querySelectorAll('source')).toHaveLength(0);
  });
});
