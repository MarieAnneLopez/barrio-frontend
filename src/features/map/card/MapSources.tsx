import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { MAP_LINKS } from '../../../lib/mapDataSources';

/** Enlace a una fuente externa: se abre aparte y no comparte la página de origen. */
export function SourceLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="break-words underline underline-offset-4">
      {children}
    </a>
  );
}

/**
 * Cita de los datos del mapa (D105) en toda ficha: Catastro Bogotá por Datos Abiertos Bogotá (CC BY
 * 4.0, datos modificados: el detalle está en Créditos) y los colaboradores de OpenStreetMap (ODbL).
 */
export function MapSources() {
  const { t } = useTranslation();
  return (
    <p className="m-0 border-t border-line pt-3 text-step--1">
      <span>{t('card.mapData')}: </span>
      <SourceLink href={MAP_LINKS.catastro}>{t('card.catastroCite')}</SourceLink>
      <span aria-hidden="true"> · </span>
      <SourceLink href={MAP_LINKS.osmCopyright}>{t('card.osmCite')}</SourceLink>
    </p>
  );
}
