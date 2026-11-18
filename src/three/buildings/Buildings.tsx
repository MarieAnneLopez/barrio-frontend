import type { Tintal3D } from '../data/format';

export interface BuildingsProps {
  world: Tintal3D;
}

/**
 * Los 20 394 edificios reales de El Tintal (Catastro UAECD + OSM, D105). Punto de montaje del carril
 * «edificios» del turno 2: volumen por pisos, ventanas por shader, techos y cornisas, selección por
 * clic (selectionStore) y luz del ciclo (sky/lightUniforms).
 */
export function Buildings(props: BuildingsProps) {
  void props;
  return null;
}
