import { describe, expect, it } from 'vitest';
import scales from './spriteScales.json';
import { SequenceSprite } from './SequenceSprite';
import { SIZES } from './sequences';

// Menor aplazado de la etapa 1: un tamaño de Mini Marie mal escrito fallaba al pintar (cellWidth lanza)
// y no al compilar. El tamaño se tipa por secuencia; `npm run typecheck` falla si estas líneas compilan.
describe('tamaños de Mini Marie como tipos', () => {
  it('los tamaños tipados son exactamente los generados en spriteScales.json', () => {
    expect(SIZES).toEqual({ wave: scales.wave.sizes, run: scales.run.sizes, sit: scales.sit.sizes, idle: scales.idle.sizes });
  });

  it('un tamaño que la secuencia no tiene no compila', () => {
    const wrong = [
      // @ts-expect-error: la sentada no tiene 160 px (sí la de saludo)
      () => <SequenceSprite name="sit" size={160} />,
      // @ts-expect-error: 150 px no es un tamaño de ninguna secuencia
      () => <SequenceSprite name="wave" size={150} />,
    ];
    expect(wrong).toHaveLength(2);
  });
});
