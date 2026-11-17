import { describe, expect, it } from 'vitest';
import { numberWords, splitMark } from './manifestoWords';

describe('palabras del manifiesto', () => {
  it('se numeran en orden de lectura, línea a línea', () => {
    const numbered = numberWords([['RECONOCE', 'TU'], ['BARRIO'], ['EL', 'TINTAL.']]);
    expect(numbered.map((line) => line.map((word) => `${word.index}:${word.text}`))).toEqual([
      ['0:RECONOCE', '1:TU'],
      ['2:BARRIO'],
      ['3:EL', '4:TINTAL.'],
    ]);
  });

  it('el signo final se separa de la palabra, para darle aire', () => {
    expect(splitMark('TINTAL.')).toEqual({ body: 'TINTAL', mark: '.' });
    expect(splitMark('¿BARRIO?')).toEqual({ body: '¿BARRIO', mark: '?' });
  });

  it('una palabra sin signo final, o que es solo un signo, queda entera', () => {
    expect(splitMark('BARRIO')).toEqual({ body: 'BARRIO', mark: '' });
    expect(splitMark('.')).toEqual({ body: '.', mark: '' });
  });
});
