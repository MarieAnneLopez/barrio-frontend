// Vuelo de la cámara a un lugar elegido en la lista de un módulo (revisión del carril mapas): al
// centro de su figura y lo bastante lejos para que la figura entera quepa en la imagen (un parque
// grande o un tramo largo de calle; antes el mapa 2D lo hacía con fitBounds), nunca más cerca que el
// vuelo a un punto. Función pura (x al este, z al sur).
import type { Geometry } from 'geojson';
import { geometryBounds } from '../../lib/placeCenter';
import type { Projection } from '../projection';
import type { FocusTarget } from './focusStore';
import { FOCUS_DISTANCE, fitDistance } from './mapView';

/** Punto y distancia del vuelo a la figura; `aspect` es el del lienzo (ancho / alto). */
export function placeFocus(geometry: Geometry | null, project: Projection, aspect: number): FocusTarget | null {
  const bounds = geometry ? geometryBounds(geometry) : null;
  if (!bounds) return null;
  const [x0, z0] = project(bounds[0]);
  const [x1, z1] = project(bounds[1]);
  const size = [Math.abs(x1 - x0), Math.abs(z1 - z0)] as const;
  return { x: (x0 + x1) / 2, z: (z0 + z1) / 2, distance: Math.max(FOCUS_DISTANCE, fitDistance(size, aspect)) };
}

/** Aspecto del lienzo de la maqueta; el de la ventana mientras el lienzo no tenga tamaño. */
export function canvasAspect(canvas: Element): number {
  const { width, height } = canvas.getBoundingClientRect();
  if (width > 0 && height > 0) return width / height;
  return window.innerWidth / Math.max(1, window.innerHeight);
}
