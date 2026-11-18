// Configuración del script de datos 3D: fuentes, rutas y caché. Todo se puede cambiar con variables
// de entorno (README.md) sin tocar el código.
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export const PATHS = {
  root,
  out: join(root, 'public/data/tintal'),
  // Descargas grandes fuera del repo (no se comitean).
  cache: process.env.DATOS3D_CACHE ?? join(homedir(), 'gran-datos', 'datos3d'),
};

/** Polígono de El Tintal (D38/D62: UPZ 78 + UPZ 79) tal como lo sirve la API del proyecto. */
export const POLIGONO = process.env.TINTAL_POLIGONO ?? 'https://reconoce-el-tintal.pages.dev/api/v1/barrio/poligono';

export const USER_AGENT = 'datos3d/1.0 (script de build; descarga unica por version)';

export const ARCGIS = 'https://serviciosgis.catastrobogota.gov.co/arcgis/rest/services/catastro';
export const CKAN = 'https://datosabiertos.bogota.gov.co/api/3/action/package_show?id=';
export const PORTAL = 'https://datosabiertos.bogota.gov.co/dataset/';

/** Capas del Mapa de Referencia de Catastro (UAECD) por servicio ArcGIS REST, con su conjunto en el portal. */
export const CATASTRO = {
  construccion: {
    servicio: 'construccion', conjunto: 'construccion', nombre: 'Construcción. Bogotá D.C',
    campos: 'OBJECTID,CONCODIGO,CONNPISOS,CONTSEMIS,CONNSOTANO,LOTECODIGO,CONMEJORA,CONVOLADIZ,CONALTURA,CONELEVACI',
  },
  lote: { servicio: 'lote', conjunto: 'lote', nombre: 'Lote. Bogotá D.C.', campos: 'OBJECTID,LOTCODIGO,MANZCODIGO' },
  placa: {
    servicio: 'placadomiciliaria', conjunto: 'placa-domiciliaria', nombre: 'Placa Domiciliaria. Bogotá D.C',
    campos: 'OBJECTID,PDOCODIGO,PDOTEXTO,PDOCINTERI,PDONVIAL,PDOCLOTE,PDOTIPO',
  },
  sector: {
    servicio: 'sectorcatastral', conjunto: 'sector-catastral', nombre: 'Sector Catastral. Bogotá D.C',
    campos: 'OBJECTID,SCACODIGO,SCANOMBRE',
  },
};

/** Overpass: el principal primero; los espejos solo si falla (el manifiesto guarda la fecha de los datos). */
export const OVERPASS = (process.env.OVERPASS_URL ?? [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
].join(',')).split(',');

export const OSM_TEXTO = {
  licencia: 'OpenStreetMap is open data, licensed under the Open Data Commons Open Database License (ODbL) '
    + 'by the OpenStreetMap Foundation (OSMF).',
  licenciaUrl: 'https://www.openstreetmap.org/copyright',
  atribucion: '© OpenStreetMap contributors',
};
