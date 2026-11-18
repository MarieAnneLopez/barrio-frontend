import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useLoadingScreenStore } from '../store/loadingScreenStore';
import { RouteFallback } from './RouteFallback';

// CLS (Lighthouse móvil, D114): mientras llega el código de la página, <main> queda vacío y el pie
// (1658 px en un celular) llenaba la pantalla; al pintarse la página bajaba ~800 px (CLS 0,77).
describe('RouteFallback: lo que hay en <main> mientras llega una página', () => {
  it('saca la pantalla de carga y reserva una pantalla de alto, sin contenido para lectores', () => {
    const { container } = render(<RouteFallback />);
    expect(useLoadingScreenStore.getState().lazy).toBeGreaterThan(0);
    const spacer = container.firstElementChild;
    expect(spacer).toHaveAttribute('aria-hidden', 'true');
    expect(spacer).toHaveClass('min-h-svh');
    expect(spacer).toBeEmptyDOMElement();
  });
});
