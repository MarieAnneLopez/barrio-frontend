// Doble de maplibre-gl para jsdom (sin WebGL): mismo contrato que usa la app.
// Los marcadores se insertan en el contenedor para poder probarlos con el DOM real.
import type { Map } from './maplibreMapMock';

export { Map } from './maplibreMapMock';

export class Marker {
  private readonly element: HTMLElement;
  private lngLat: [number, number] = [0, 0];

  constructor(options: { element: HTMLElement }) {
    this.element = options.element;
  }

  setLngLat(lngLat: [number, number]): this {
    this.lngLat = lngLat;
    return this;
  }

  getLngLat(): { lng: number; lat: number } {
    return { lng: this.lngLat[0], lat: this.lngLat[1] };
  }

  getElement(): HTMLElement {
    return this.element;
  }

  addTo(map: Map): this {
    map.container.append(this.element);
    return this;
  }

  remove(): void {
    this.element.remove();
  }
}

export function setWorkerUrl(): void {}

export class NavigationControl {
  onAdd(): HTMLElement {
    return document.createElement('div');
  }

  onRemove(): void {}
}
