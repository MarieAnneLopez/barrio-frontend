import type { IControl, LngLatBoundsLike, Map as MapLibreMap } from 'maplibre-gl';

/**
 * Botón «Recentrar» del mapa temático (H34): vuelve a encuadrar todo El Tintal.
 * Es un <button> real con nombre accesible, dentro del grupo de controles de MapLibre.
 */
export class RecenterControl implements IControl {
  private container: HTMLDivElement | null = null;

  constructor(
    private readonly bounds: LngLatBoundsLike,
    private readonly label: string,
    private readonly animate: () => boolean,
  ) {}

  onAdd(map: MapLibreMap): HTMLElement {
    const container = document.createElement('div');
    container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'map-recenter';
    button.setAttribute('aria-label', this.label);
    button.title = this.label;
    button.textContent = '⌖';
    button.addEventListener('click', () => {
      map.fitBounds(this.bounds, { padding: 24, animate: this.animate() });
    });
    container.append(button);
    this.container = container;
    return container;
  }

  onRemove(): void {
    this.container?.remove();
    this.container = null;
  }
}
