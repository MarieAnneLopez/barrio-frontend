// Doble de maplibre-gl para jsdom (sin WebGL): mismo contrato que usa la app.
// Los marcadores se insertan en el contenedor para poder probarlos con el DOM real.
type Handler = () => void;

export class Map {
  readonly container: HTMLElement;
  readonly options: Record<string, unknown>;
  zoom = 14;
  camera: { center?: unknown; zoom?: number; animated?: boolean } = {};

  constructor(options: { container: HTMLElement } & Record<string, unknown>) {
    this.container = options.container;
    this.options = options;
  }

  on(event: string, handler: Handler): this {
    if (event === 'load') queueMicrotask(handler);
    return this;
  }

  addControl(): this {
    return this;
  }

  resize(): this {
    return this;
  }

  fitBounds(): this {
    return this;
  }

  getZoom(): number {
    return this.zoom;
  }

  flyTo(options: { center: unknown; zoom: number }): this {
    this.camera = { ...options, animated: true };
    return this;
  }

  jumpTo(options: { center: unknown; zoom: number }): this {
    this.camera = { ...options, animated: false };
    return this;
  }

  remove(): void {
    this.container.replaceChildren();
  }
}

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
