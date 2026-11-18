// Manifiesto de public/data/tintal: proyección, archivos (tamaños y sha256), conteos y fuentes.
// Su fecha es la de la consulta más reciente a las fuentes: con la misma caché, sale idéntico.
import { SPEC } from './spec.mjs';

export const LICENCIA_ARCHIVOS = 'Los archivos combinan datos de Catastro Bogotá (UAECD, Creative Commons Attribution 4.0, '
  + 'https://creativecommons.org/licenses/by/4.0/) y de OpenStreetMap (Open Database License 1.0, '
  + 'https://opendatacommons.org/licenses/odbl/1-0/). Los datos de Catastro están modificados: recortados al '
  + 'barrio, huellas limpiadas y redondeadas a 10 cm en una proyección local, direcciones armadas desde las '
  + 'placas y unidas a cada edificio por código de lote, recodificados en el formato TNT3 y unidos con nombres '
  + 'y edificios de OSM. Lo que deriva de OSM (vías, cruces, semáforos, suelo, árboles, nombres y edificios '
  + 'complementados) es una base de datos derivada bajo ODbL 1.0; los datos de Catastro conservan su licencia '
  + 'CC BY 4.0 con atribución a la UAECD. Toda vista que los muestre debe citar «© OpenStreetMap contributors» '
  + 'y «Unidad Administrativa Especial de Catastro Distrital - UAECD», e indicar que los datos de Catastro '
  + 'fueron modificados.';

export function buildManifest({ feature, info, files, conteos, fuentes }) {
  const props = feature.properties ?? {};
  return {
    version: SPEC.version,
    formato: 'TNT3 (scripts/datos3d/FORMATO.md)',
    generado: fuentes.map((f) => f.consultado).sort().at(-1),
    barrio: { nombre: props.nombre ?? 'El Tintal', definicion: props.definicion ?? '', areaKm2: props.area_km2 ?? null },
    proyeccion: {
      metodo: 'equirectangular local, la misma de src/three/projection.ts (createProjection(bbox))',
      bbox: feature.bbox,
      origen: info.origen,
      metrosPorGradoLon: info.metrosPorGradoLon,
      metrosPorGradoLat: info.metrosPorGradoLat,
      ejes: 'x hacia el este y z hacia el sur (el norte es -z), en metros',
      unidadesPorMetro: SPEC.unidadesPorMetro,
    },
    archivos: files,
    conteos,
    licenciaDeLosArchivos: LICENCIA_ARCHIVOS,
    fuentes,
  };
}
