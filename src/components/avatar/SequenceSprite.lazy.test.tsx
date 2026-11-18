import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SequenceSprite } from './SequenceSprite';

const atlas = () => document.querySelector<HTMLImageElement>('.sequence__strip');

// Revisión de sprites32: el reposo del pie de página pesa 122 KB a 1× (677 KB por encima de 2×) y se
// bajaba en todas las páginas al cargar. Lejos de la pantalla, Mini Marie espera a que se acerque.
describe('SequenceSprite: descarga diferida', () => {
  it('con lazy, el navegador la baja al acercarse y la decodifica sin frenar la página', () => {
    render(<SequenceSprite name="idle" size={140} lazy />);
    expect(atlas()).toHaveAttribute('loading', 'lazy');
    expect(atlas()).toHaveAttribute('decoding', 'async');
  });

  it('sin lazy se baja enseguida: la carga, la bienvenida y el chat se ven al momento', () => {
    render(<SequenceSprite name="run" size={210} />);
    expect(atlas()).not.toHaveAttribute('loading');
    expect(atlas()).not.toHaveAttribute('decoding');
  });
});
