// Fuentes y licencias de los datos de la maqueta y los mapas (D105, scripts/datos3d/FORMATO.md §8):
// Catastro Bogotá (UAECD) por Datos Abiertos Bogotá, CC BY 4.0, y OpenStreetMap, ODbL 1.0. La ficha y
// la página de Créditos los citan con estos enlaces.

export const MAP_LINKS = {
  /** Conjunto «Construcción» de Catastro: el portal no abre un registro por lote (FORMATO.md §3). */
  catastro: 'https://datosabiertos.bogota.gov.co/dataset/construccion',
  ccBy: 'https://creativecommons.org/licenses/by/4.0/deed.es',
  osmCopyright: 'https://www.openstreetmap.org/copyright',
  odbl: 'https://opendatacommons.org/licenses/odbl/1-0/',
} as const;

/** Los cuatro conjuntos de Catastro que usa la maqueta (manifest.json, fuentes). */
export const CATASTRO_DATASETS = ['construccion', 'lote', 'placa-domiciliaria', 'sector-catastral'] as const;

export const datasetUrl = (id: string) => `https://datosabiertos.bogota.gov.co/dataset/${id}`;
