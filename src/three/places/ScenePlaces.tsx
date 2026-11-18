import type { Projection } from '../projection';
import type { CategoryData } from '../useTintalData';

export interface ScenePlacesProps {
  /** Lugares de los 14 módulos (API); null mientras la API no responde: la maqueta no los espera. */
  places: CategoryData[] | null;
  /** Proyección de los datos 3D (lon/lat → metros), la misma de TNT3. */
  project: Projection;
}

/**
 * Marcadores de los módulos dentro de la escena (solo registros reales: los «dato de ejemplo» siguen
 * en la lista del panel, no en el mapa). Punto de montaje del carril «mapas» del turno 2; el clic
 * elige el lugar (selectionStore) y la ficha de la derecha lo muestra.
 */
export function ScenePlaces(props: ScenePlacesProps) {
  void props;
  return null;
}
