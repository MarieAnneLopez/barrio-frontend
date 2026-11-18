import { useTranslation } from 'react-i18next';
import { MAP_LINKS } from '../../../lib/mapDataSources';
import { osmRef, osmUrl, type BuildingInfo } from '../../../three/selection/buildingInfo';
import { MapSources, SourceLink } from './MapSources';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-step--1">{label}</dt>
      <dd className="m-0 break-words">{value}</dd>
    </div>
  );
}

/** Procedencia del edificio (Catastro, con su lote, u OSM) y, si lo tiene, de su nombre (OSM). */
function BuildingSource({ info }: { info: BuildingInfo }) {
  const { t } = useTranslation();
  const own = info.osm === 0
    ? { href: MAP_LINKS.catastro, text: info.lot ? t('card.catastroLot', { lot: info.lot }) : t('card.catastro') }
    : { href: osmUrl(info.osm), text: t('card.osmRef', { ref: osmRef(info.osm) }) };
  return (
    <p className="m-0 flex flex-col text-step--1">
      <span>
        {t('card.source')}: <SourceLink href={own.href}>{own.text}</SourceLink>
      </span>
      {info.nameRef ? (
        <span>
          {t('card.nameSource')}: <SourceLink href={osmUrl(info.nameRef)}>{t('card.osmRef', { ref: info.nameRef })}</SourceLink>
        </span>
      ) : null}
    </p>
  );
}

/**
 * Ficha de un edificio real (FORMATO.md §3): título con su nombre o, si no tiene, su dirección (nunca
 * vacío); la dirección siempre con lo que dice DIRT, porque solo con 1 la placa está en el propio
 * edificio; pisos «sin dato» cuando la fuente no los da; lote, sector y fuentes.
 */
export function BuildingCard({ info, titleId }: { info: BuildingInfo; titleId: string }) {
  const { t } = useTranslation();
  const floors = info.floors === null ? t('card.floorsUnknown') : t('card.floorCount', { count: info.floors });
  const extra = [
    info.base > 0 ? t('card.overhang', { base: info.base }) : '',
    info.basements > 0 ? t('card.basements', { count: info.basements }) : '',
  ].filter(Boolean);

  return (
    <>
      <p className="ui-eyebrow m-0 pr-10">
        {t('card.building')}
        {info.underConstruction ? ` · ${t('card.underConstruction')}` : ''}
      </p>
      <h2 id={titleId} tabIndex={-1} className="m-0 text-step-1 break-words">
        {info.name ?? info.address ?? t('card.noAddress')}
      </h2>
      <dl className="m-0 flex flex-col gap-2">
        <Row label={t(`card.addressKind.${info.addressKind}`)} value={info.address ?? t('card.none')} />
        <Row label={t('card.floors')} value={[floors, ...extra].join(', ')} />
        {info.lot ? <Row label={t('card.lot')} value={info.lot} /> : null}
        {info.sector ? <Row label={t('card.sector')} value={info.sector} /> : null}
      </dl>
      <BuildingSource info={info} />
      <MapSources />
    </>
  );
}
