import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RibbonGrid } from './RibbonGrid';
import type { RibbonPhoto } from './ribbonPhotos';

const photo = (i: number) =>
  ({
    key: `foto-${i}`,
    label: `Lugar ${i}`,
    alt: `Foto ${i} del barrio`,
    src: `/assets/photos/lugares/foto-${i}-1280.webp`,
    thumb: { src: `/assets/photos/lugares/foto-${i}-640.webp` },
    photo: { autor: 'Autora', licencia: 'CC BY-SA 4.0', source_ref: null },
    module: null,
  }) as unknown as RibbonPhoto;

// LCP de Galería (D116): mientras llega el motor WebGL la rejilla está en pantalla y su primera
// foto es el elemento más grande; en diferido y con prioridad baja se pedía 2,3 s tarde.
describe('RibbonGrid: la primera foto es la prioritaria', () => {
  it('las de la primera fila van sin diferir y la primera con fetchpriority alta; el resto, en diferido', () => {
    const { container } = render(<RibbonGrid photos={[0, 1, 2, 3, 4].map(photo)} onOpen={() => undefined} />);
    const images = [...container.querySelectorAll('img')];
    expect(images.map((img) => img.getAttribute('loading'))).toEqual(['eager', 'eager', 'eager', 'lazy', 'lazy']);
    expect(images.map((img) => img.getAttribute('fetchpriority'))).toEqual(['high', null, null, null, null]);
  });
});
