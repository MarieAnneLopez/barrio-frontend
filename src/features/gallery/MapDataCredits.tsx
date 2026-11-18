import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { CATASTRO_DATASETS, datasetUrl, MAP_LINKS } from '../../lib/mapDataSources';
import { SourceLink } from '../map/card/MapSources';

const CARD = 'tone-papel flex flex-col gap-2 rounded-sm bg-pink p-4 text-step--1 text-fg';

/**
 * Créditos de los datos de los mapas (D105, FORMATO.md §8): Catastro Bogotá (UAECD) por Datos
 * Abiertos Bogotá, CC BY 4.0, con sus cuatro conjuntos y lo que se les cambió; y OpenStreetMap,
 * ODbL 1.0, con lo que aporta y la licencia de lo derivado. Sin enlaces a servicios de Google.
 */
export function MapDataCredits() {
  const { t } = useTranslation();
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4">
      <h2 id={titleId} className="m-0 text-step-2 text-fg">{t('credits.map.title')}</h2>
      <p className="ui-prose m-0">{t('credits.map.intro')}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className={CARD}>
          <h3 className="m-0 text-step-0">
            <SourceLink href={MAP_LINKS.catastro}>{t('card.catastroCite')}</SourceLink>
          </h3>
          <p className="m-0">{t('credits.map.entity')}</p>
          <p className="m-0">{t('credits.map.catastroUse')}</p>
          <p className="m-0">
            {t('credits.map.license')} <SourceLink href={MAP_LINKS.ccBy}>{t('credits.map.ccBy')}</SourceLink>
          </p>
          <p className="m-0">{t('credits.map.datasets')}</p>
          <ul className="m-0 flex flex-wrap gap-x-4 gap-y-1 pl-5">
            {CATASTRO_DATASETS.map((id) => (
              <li key={id}>
                <SourceLink href={datasetUrl(id)}>{t(`credits.map.dataset.${id}`)}</SourceLink>
              </li>
            ))}
          </ul>
          <p className="m-0">{t('credits.map.modified')}</p>
        </div>
        <div className={CARD}>
          <h3 className="m-0 text-step-0">
            <SourceLink href={MAP_LINKS.osmCopyright}>{t('card.osmCite')}</SourceLink>
          </h3>
          <p className="m-0">{t('credits.map.osmUse')}</p>
          <p className="m-0">
            {t('credits.map.license')} <SourceLink href={MAP_LINKS.odbl}>{t('credits.map.odbl')}</SourceLink>
          </p>
          <p className="m-0">{t('credits.map.osmShare')}</p>
        </div>
      </div>
    </section>
  );
}
