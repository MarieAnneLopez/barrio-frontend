import { Fragment, useEffect, useMemo } from 'react';
import { useHeroStore } from '../heroStore';
import type { Projection } from '../projection';
import type { CategoryData } from '../useTintalData';
import { PlaceHighlight } from './PlaceHighlight';
import { PlaceMarkers } from './PlaceMarkers';
import { PlaceOutline } from './PlaceOutline';
import { usePlaceScope } from './placeScope';
import { sceneLayers } from './sceneLayers';

export interface ScenePlacesProps {
  /** Lugares de los 14 módulos (API); null mientras la API no responde: la maqueta no los espera. */
  places: CategoryData[] | null;
  /** Proyección de los datos 3D (lon/lat → metros), la misma de TNT3. */
  project: Projection;
}

/**
 * Marcadores de los módulos dentro de la escena (gran actualización). Solo registros reales: los
 * «dato de ejemplo» siguen en la lista del panel, no en el mapa. En el Inicio y en Mapa 3D van los 14
 * módulos (la leyenda oculta los que el visitante quiera y cuenta lo dibujado); dentro de un módulo,
 * solo los suyos (placeScope). El clic elige el lugar (selectionStore) y la ficha de la derecha lo muestra.
 */
export function ScenePlaces({ places, project }: ScenePlacesProps) {
  const slug = usePlaceScope((s) => s.slug);
  const collection = usePlaceScope((s) => s.collection);
  const hidden = useHeroStore((s) => s.hidden);
  const setDrawn = useHeroStore((s) => s.setDrawn);
  const layers = useMemo(() => sceneLayers(places, { slug, collection }, project), [places, slug, collection, project]);

  // La leyenda de Mapa 3D compara lo dibujado con la base de datos (H34): se cuenta con los 14.
  useEffect(() => {
    if (slug === null) setDrawn(Object.fromEntries(layers.map((layer) => [layer.slug, layer.drawn])));
  }, [layers, slug, setDrawn]);

  const shown = useMemo(
    () => (slug === null ? layers.filter((layer) => !hidden.includes(layer.slug)) : layers),
    [layers, slug, hidden],
  );

  return (
    <>
      {shown.map((layer) => (
        <Fragment key={layer.slug}>
          {layer.outline.length ? <PlaceOutline layer={layer} /> : null}
          {layer.markers.length ? <PlaceMarkers layer={layer} /> : null}
        </Fragment>
      ))}
      <PlaceHighlight layers={shown} />
    </>
  );
}
