import { useApi } from '../../hooks/useApi';
import type { BarrioPolygon, Historia, ModuleItem, Page } from '../../lib/apiTypes';
import type { Indicator } from './Indicators';

const ONE = { size: 1 };

/** Datos de la página de Historia: hitos y fuentes, ficha de Kennedy, polígono y conteos. */
export function useHistoryData() {
  const historia = useApi<Historia>('/historia');
  const localidad = useApi<Page<ModuleItem>>('/localidad', ONE);
  const tintal = useApi<BarrioPolygon>('/barrio/poligono');
  const lotes = useApi<Page<ModuleItem>>('/datos-catastrales', ONE);
  const zonas = useApi<Page<ModuleItem>>('/zonas-verdes', ONE);

  const kennedy = localidad.data?.items[0];
  const indicators: Indicator[] = [];
  if (typeof kennedy?.poblacion === 'number') indicators.push({ key: 'population', value: kennedy.poblacion });
  if (typeof kennedy?.superficie_km2 === 'number') {
    indicators.push({ key: 'area', value: kennedy.superficie_km2, decimals: 2 });
  }
  if (lotes.data) indicators.push({ key: 'lots', value: lotes.data.total });
  if (zonas.data) indicators.push({ key: 'greenAreas', value: zonas.data.total });

  return { historia, kennedy, tintal: tintal.data, indicators };
}
