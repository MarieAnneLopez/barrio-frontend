import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import i18n from '../../../../i18n/i18n';
import { Manifesto } from './Manifesto';
import { fakeFrames, fakeViewport } from './testDoubles';

const WORDS = ['RECONOCE', 'TU', 'BARRIO', 'EL', 'TINTAL.'];
const TAGLINE = 'Explora los lugares, la historia y la vida de tu barrio.';
const section = () => document.querySelector<HTMLElement>('[data-chapter="1"]') as HTMLElement;
const hidden = (node: Element) => node.closest('[aria-hidden="true"]') !== null;
/** La animación no corre sola: sin cuadros ni pantalla, el capítulo se queda en su estado de espera. */
const mount = () => {
  fakeFrames();
  fakeViewport();
  return render(<Manifesto />);
};

afterEach(() => act(() => i18n.changeLanguage('es')));

describe('Manifiesto (capítulo 1): contenido y accesibilidad', () => {
  it('un solo h1 con su nombre accesible; los fragmentos visibles quedan fuera del lector de pantalla', () => {
    mount();
    const title = screen.getByRole('heading', { level: 1, name: 'Reconoce tu barrio. El Tintal.' });
    expect(document.querySelectorAll('h1')).toHaveLength(1);
    for (const word of WORDS) {
      const fragments = [...section().querySelectorAll('[data-word]')].filter((node) => node.textContent === word);
      expect(fragments).toHaveLength(2); // dos capas idénticas: papel sobre noche y noche sobre papel
      expect(fragments.every(hidden)).toBe(true);
      expect(fragments.filter((node) => title.contains(node))).toHaveLength(1);
    }
  });

  it('5 palabras en 3 líneas, numeradas en orden de lectura y cada una dentro de su máscara', () => {
    mount();
    for (const tone of ['noche', 'papel']) {
      const layer = section().querySelector(`[data-layer="${tone}"]`) as HTMLElement;
      const lines = [...layer.querySelectorAll('.manifesto__line')];
      expect(lines.map((line) => line.querySelectorAll('[data-word]').length)).toEqual([2, 1, 2]);
      const words = [...layer.querySelectorAll<HTMLElement>('[data-word]')];
      expect(words.map((word) => `${word.dataset.word}:${word.textContent}`)).toEqual(WORDS.map((word, i) => `${i}:${word}`));
      expect(words.every((word) => word.parentElement?.classList.contains('manifesto__mask'))).toBe(true);
      // El punto final va en su propio fragmento: con el tracking negativo se pegaba a la L.
      expect([...layer.querySelectorAll('.manifesto__mark')].map((mark) => `${mark.parentElement?.textContent}|${mark.textContent}`)).toEqual(['TINTAL.|.']);
    }
  });

  it('la capa papel es la real y va encima; la capa noche es un duplicado decorativo sin h1', () => {
    mount();
    const layers = [...section().querySelectorAll<HTMLElement>('[data-layer]')];
    expect(layers.map((layer) => layer.dataset.layer)).toEqual(['noche', 'papel']);
    expect(layers.map(hidden)).toEqual([true, false]);
    expect(layers[0]?.querySelector('h1')).toBeNull();
  });

  it('abajo van el lema, que el lector de pantalla lee una sola vez, y una flecha decorativa', () => {
    mount();
    const taglines = screen.getAllByText(TAGLINE);
    expect(taglines).toHaveLength(2);
    expect(taglines.filter((node) => !hidden(node))).toHaveLength(1);
    const arrows = [...section().querySelectorAll('svg')];
    expect(arrows).toHaveLength(2);
    expect(arrows.every((arrow) => arrow.getAttribute('aria-hidden') === 'true')).toBe(true);
    // La flecha va a la izquierda del lema: la esquina derecha es del chat y de WhatsApp.
    expect(arrows.every((arrow) => arrow.nextElementSibling?.textContent === TAGLINE)).toBe(true);
  });

  it('no repite lo que ya muestra el header: ni logo, ni nombre corto, ni ubicación', () => {
    mount();
    expect(section().querySelector('img')).toBeNull();
    expect(screen.queryByText('Kennedy · Bogotá D.C.')).toBeNull();
  });

  it('declara su capítulo y lo que hay bajo el header: noche al empezar, con el header flotando', () => {
    mount();
    expect(section().tagName).toBe('SECTION');
    expect(section()).toHaveAttribute('data-tone', 'noche');
    expect(section()).toHaveAttribute('data-header-float');
    expect(section()).not.toHaveAttribute('data-done');
  });

  it('en inglés usa las mismas claves: otro nombre accesible y otras palabras', async () => {
    mount();
    await act(() => i18n.changeLanguage('en'));
    expect(screen.getByRole('heading', { level: 1, name: 'Know your barrio. El Tintal.' })).toBeInTheDocument();
    const words = [...section().querySelectorAll('[data-layer="papel"] [data-word]')];
    expect(words.map((word) => word.textContent)).toEqual(['KNOW', 'YOUR', 'BARRIO', 'EL', 'TINTAL.']);
    expect(screen.getAllByText('Explore the places, history and life of your neighborhood.')).toHaveLength(2);
  });
});
