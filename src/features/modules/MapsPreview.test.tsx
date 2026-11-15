import { render, screen } from '@testing-library/react';
import type { FeatureCollection, Point } from 'geojson';
import { describe, expect, it, vi } from 'vitest';
import '../../i18n/i18n';
import { mapsSearchUrl, placeCenter, streetViewUrl } from '../../lib/googleMapsUrls';
import { MapsPreview } from './MapsPreview';
import { pathOf, project, VIEW, windowAround } from './previewSvg';

vi.mock('../../components/map/baseMapData', () => ({
  loadBaseMap: () => Promise.reject(new Error('sin red en la prueba')),
}));

const POINT: Point = { type: 'Point', coordinates: [-74.157404, 4.653067] };
const AT = { lat: 4.653067, lon: -74.157404 };

describe('Enlace a Google Maps con vista previa propia', () => {
  it('usa los formatos oficiales de Maps URLs (search y map_action=pano)', () => {
    expect(placeCenter(POINT)).toEqual(AT);
    expect(mapsSearchUrl(AT)).toBe('https://www.google.com/maps/search/?api=1&query=4.653067%2C-74.157404');
    expect(streetViewUrl(AT)).toBe(
      'https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=4.653067%2C-74.157404',
    );
  });

  it('el centro de un tramo o un parque es el del rectángulo que lo contiene', () => {
    expect(placeCenter({ type: 'LineString', coordinates: [[-74.16, 4.65], [-74.15, 4.66]] })).toEqual({
      lat: 4.655, lon: -74.155,
    });
    expect(placeCenter(null)).toBeNull();
  });

  it('proyecta el lugar al centro del lienzo y descarta lo que queda lejos', () => {
    const w = windowAround({ lat: 4.65, lon: -74.15 });
    expect(project(w, [-74.15, 4.65])).toEqual([VIEW.width / 2, VIEW.height / 2]);
    const far: FeatureCollection = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {},
      geometry: { type: 'LineString', coordinates: [[-74.0, 4.6], [-74.01, 4.61]] } }] };
    expect(pathOf(w, far, false)).toBe('');
  });

  it('el dibujo abre Google Maps en otra pestaña y hay enlace a Street View', () => {
    render(<MapsPreview place="Parque El Tintal" geometry={POINT} />);
    const maps = screen.getByRole('link', { name: /^Ver en Google Maps ↗: Parque El Tintal/ });
    expect(maps).toHaveAttribute('href', 'https://www.google.com/maps/search/?api=1&query=4.653067%2C-74.157404');
    const street = screen.getByRole('link', { name: /Abrir Street View/ });
    for (const link of [maps, street]) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
    expect(screen.getByText(/© OpenStreetMap/)).toBeInTheDocument();
  });

  it('sin geometría no muestra nada', () => {
    const { container } = render(<MapsPreview place="X" geometry={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
