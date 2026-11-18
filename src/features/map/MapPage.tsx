import { useTranslation } from 'react-i18next';
import { MapLegend } from './MapLegend';
import { MapStage } from './stage/MapStage';

/**
 * /mapa (gran actualización): la maqueta 3D de El Tintal a pantalla completa, con los lugares reales
 * de los 14 módulos. La leyenda con su filtro, los enlaces a cada módulo y la nota sobre los datos
 * van en el panel izquierdo; lo elegido abre su ficha a la derecha.
 */
export function MapPage() {
  const { t } = useTranslation();
  return (
    <MapStage label={t('hero.label')} title={t('nav.map')} mascot>
      <p className="m-0">{t('pages.map')}</p>
      <p className="m-0 text-step--1">{t('mapPage.explore')}</p>
      <MapLegend />
      <p className="m-0 text-step--1">{t('mapPage.note')}</p>
    </MapStage>
  );
}
