import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { painted } from '../../test/loaderScreens';

describe('precarga de Mini Marie', () => {
  it('pide un solo atlas de carrera en todos los tamaños de ventana', () => {
    const html = readFileSync('index.html', 'utf8');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const links = doc.querySelectorAll('link[as="image"][href*="/run/"]');
    expect(links).toHaveLength(1);
    expect(links[0]?.getAttribute('href')).toBe(painted());
    expect(links[0]?.hasAttribute('media')).toBe(false);
  });
});
