import { describe, expect, it } from 'vitest';
import { MODES, tokenRatio } from '../../../../test/classContrast';
import { readSheets } from './cssRules';

// Medidas de la especificación (docs/superpowers/specs, §6, cap. 1): composición y titular.
const { rule, media } = readSheets('manifesto.css', 'manifesto-title.css');
const [title, wide] = [rule('.manifesto__title'), rule('.manifesto__title', media('min-width: 640px'))];

describe('hoja del manifiesto: composición', () => {
  it('la sección mide 100svh y es el contenedor con el que se mide el titular', () => {
    const section = rule('.manifesto');
    expect(section).toContain('height: 100svh;');
    expect(section).toContain('container-type: inline-size;');
    expect(section).toContain('background-color: var(--bg-accent);'); // base rosa claro (D96)
  });

  it('titular en display al 16,2 % del ancho (16,5 % desde 640 px), interlineado 1,16 (0,96), tracking −0,035em', () => {
    for (const text of ['--size: 16.2;', '--leading: 1.16;', '--track: 0.035em;']) expect(title).toContain(text);
    for (const text of ['--size: 16.5;', '--leading: 0.96;']) expect(wide).toContain(text);
    expect(title).toContain('font-family: var(--ff-display);');
    expect(title).toContain('font-weight: 400;');
    expect(title).toContain('line-height: var(--leading);');
    expect(title).toContain('letter-spacing: calc(-1 * var(--track));');
  });

  it('el cuerpo es un % del ancho de la sección, salvo que el alto no dé para las 3 líneas', () => {
    // 13rem = header (4rem) + pie (9rem). A 1440 × 900 manda el ancho: 237,6 px < (900 − 208) / 2,88 = 240,3 px.
    expect(title).toContain('font-size: min(calc(var(--size) * 1cqw), calc((100svh - 13rem) / (3 * var(--leading))));');
    expect(title).toContain('font-size: calc(var(--size) * 1vw);'); // navegadores sin unidades de contenedor
  });

  it('sangrías: línea 2 al 26 % (33 %) y línea 3 al 4 % (6 %) del ancho', () => {
    for (const text of ['--indent-2: 26;', '--indent-3: 4;']) expect(title).toContain(text);
    for (const text of ['--indent-2: 33;', '--indent-3: 6;']) expect(wide).toContain(text);
    // 1em · sangría / cuerpo: con el cuerpo al 16,5 % del ancho, 33 / 16,5 = 2em = 33 % del ancho.
    expect(rule('.manifesto__line:nth-child(2)')).toContain('padding-left: calc(1em * var(--indent-2) / var(--size));');
    expect(rule('.manifesto__line:nth-child(3)')).toContain('padding-left: calc(1em * var(--indent-3) / var(--size));');
  });

  it.each(MODES)('en modo %s las dos capas se leen: el texto nunca se pierde en el revelado', (_mode, vars) => {
    for (const tone of ['noche', 'papel']) {
      const layer = rule(`.manifesto__layer--${tone}`);
      const background = /background-color: (var\(--[\w-]+\));/.exec(layer)?.[1] ?? '';
      const text = /(?:^|\s)color: (var\(--[\w-]+\));/.exec(layer)?.[1] ?? '';
      expect(tokenRatio(text, background, vars), `${text} sobre ${background}`).toBeGreaterThanOrEqual(4.5);
    }
    expect(rule('.manifesto__layer--noche')).toContain('background-color: var(--bg-accent);'); // base rosa claro
    expect(rule('.manifesto__layer--papel')).toContain('background-color: var(--bg-primary);'); // revelado crema
  });

  it('cada capa deja libres los 4rem del header, que flota encima', () => {
    const layer = rule('.manifesto__layer');
    expect(layer).toContain('--gutter: max(1rem, 5vw);');
    expect(layer).toContain('padding: 4rem var(--gutter) 2rem;');
  });

  it('el pie deja libre la esquina de abajo a la derecha, donde flotan el chat y WhatsApp (10rem)', () => {
    // WhatsApp ocupa de 1,5 a 5rem desde el borde derecho y el chat de 5,75 a 9,25rem (ChatWidget, WhatsAppFloat).
    expect(rule('.manifesto__foot')).toContain('margin-right: max(0px, calc(10rem - var(--gutter)));');
  });
});
