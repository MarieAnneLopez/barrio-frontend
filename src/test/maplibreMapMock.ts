// Doble del Map de maplibre-gl (sin WebGL). Guarda fuentes, capas y estado de
// selección para que las pruebas lean lo que la app le pidió al mapa.
type Handler = (event?: { features?: { id?: number }[] }) => void;

export class Map {
  /** Mapas creados: las pruebas inspeccionan el último y simulan clics en capas. */
  static readonly instances: Map[] = [];
  readonly container: HTMLElement;
  readonly options: Record<string, unknown>;
  zoom = 14;
  camera: { center?: unknown; zoom?: number; animated?: boolean; bounds?: unknown } = {};
  readonly sources: Record<string, unknown> = {};
  readonly layers: string[] = [];
  readonly featureState: Record<string, { selected?: boolean }> = {};
  private readonly layerHandlers: Record<string, Handler[]> = {};

  constructor(options: { container: HTMLElement } & Record<string, unknown>) {
    this.container = options.container;
    this.options = options;
    Map.instances.push(this);
  }

  on(event: string, layerOrHandler: string | Handler, handler?: Handler): this {
    if (typeof layerOrHandler === 'string') {
      const key = `${event}:${layerOrHandler}`;
      (this.layerHandlers[key] ??= []).push(handler as Handler);
    } else if (event === 'load') queueMicrotask(() => layerOrHandler());
    return this;
  }

  off(event: string, layer: string, handler: Handler): this {
    const key = `${event}:${layer}`;
    this.layerHandlers[key] = (this.layerHandlers[key] ?? []).filter((h) => h !== handler);
    return this;
  }

  /** Simula un clic sobre una figura de la capa. */
  clickLayer(layer: string, id: number): void {
    this.layerHandlers[`click:${layer}`]?.forEach((h) => h({ features: [{ id }] }));
  }

  addSource(id: string, source: unknown): this {
    this.sources[id] = source;
    return this;
  }

  removeSource(id: string): this {
    Reflect.deleteProperty(this.sources, id);
    return this;
  }

  addLayer(layer: { id: string }): this {
    this.layers.push(layer.id);
    return this;
  }

  removeLayer(id: string): this {
    this.layers.splice(this.layers.indexOf(id), 1);
    return this;
  }

  getLayer = (id: string): unknown => (this.layers.includes(id) ? { id } : undefined);

  setFeatureState(target: { id: number }, state: { selected?: boolean }): this {
    this.featureState[String(target.id)] = state;
    return this;
  }

  getCanvas = (): HTMLElement => this.container;
  addControl = (): this => this;
  resize = (): this => this;
  getZoom = (): number => this.zoom;

  fitBounds(bounds: unknown, options?: { animate?: boolean }): this {
    this.camera = { ...this.camera, bounds, animated: options?.animate !== false };
    return this;
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
