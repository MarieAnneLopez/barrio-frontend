// Capas de Catastro por su servicio ArcGIS REST, solo el recorte de El Tintal: primero los
// OBJECTID que tocan el polígono (consulta espacial) y luego las entidades en lotes de 1000.
// (La paginación por resultOffset con geometría devuelve vacío en este servidor; por id funciona.)
import { ARCGIS } from './config.mjs';

const PAGE = 1000;

function parsed(text) {
  const json = JSON.parse(text);
  if (json.error) throw new Error(`ArcGIS: ${json.error.message ?? JSON.stringify(json.error)}`);
  return json;
}

const checkIds = (text) => {
  if (!Array.isArray(parsed(text).objectIds)) throw new Error('ArcGIS no devolvió objectIds');
};
const checkPage = (text) => {
  if (!Array.isArray(parsed(text).features)) throw new Error('ArcGIS no devolvió features');
};

/** → { features (GeoJSON, WGS84), url, fecha } de la capa 0 del servicio; `rings` en lon/lat. */
export async function downloadLayer(request, layer, rings) {
  const url = `${ARCGIS}/${layer.servicio}/MapServer/0/query`;
  const geometry = JSON.stringify({ rings, spatialReference: { wkid: 4326 } });
  const spatial = { where: '1=1', geometry, geometryType: 'esriGeometryPolygon', inSR: '4326', spatialRel: 'esriSpatialRelIntersects' };
  const label = `Catastro ${layer.servicio}`;
  const head = await request(url, { form: { ...spatial, returnIdsOnly: 'true', f: 'json' }, validate: checkIds, label });
  const ids = parsed(head.text).objectIds.sort((a, b) => a - b);
  const features = [];
  for (let i = 0; i < ids.length; i += PAGE) {
    const form = { objectIds: ids.slice(i, i + PAGE).join(','), outFields: layer.campos, outSR: '4326', f: 'geojson', geometryPrecision: '7' };
    const page = await request(url, { form, validate: checkPage, label: `${label} ${i / PAGE + 1}` });
    features.push(...parsed(page.text).features);
  }
  if (features.length !== ids.length) throw new Error(`${label}: ${features.length} entidades de ${ids.length} ids`);
  return { features, url, fecha: head.fecha };
}

/** Atribución que publica el propio servicio (copyrightText de la capa). */
export async function layerCopyright(request, layer) {
  const { text } = await request(`${ARCGIS}/${layer.servicio}/MapServer/0?f=json`, {
    validate: (t) => parsed(t), label: `Catastro ${layer.servicio} (metadatos)`,
  });
  return parsed(text).copyrightText ?? '';
}

/** Metadatos del conjunto en el portal (licencia tal como la publica, fecha y versiones). */
export async function datasetInfo(request, ckanUrl, conjunto) {
  const { text, fecha } = await request(`${ckanUrl}${conjunto}`, {
    validate: (t) => {
      if (!JSON.parse(t).success) throw new Error('CKAN sin éxito');
    },
    label: `portal ${conjunto}`,
  });
  const result = JSON.parse(text).result;
  const versions = result.resources.map((r) => r.name).filter((n) => /Versi[oó]n/i.test(n));
  return {
    titulo: result.title, entidad: result.organization?.title ?? '', licencia: result.license_title,
    licenciaUrl: result.license_url, modificado: result.metadata_modified,
    ultimaVersion: result.resources.find((r) => r.format === 'GPKG')?.url.match(/(\d\d\.\d\d)\.zip$/)?.[1] ?? null,
    versiones: versions.length, consultado: fecha,
  };
}
