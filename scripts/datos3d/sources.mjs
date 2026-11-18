// Descarga (o lee de la caché) todas las fuentes y arma su ficha para el manifiesto: servicio,
// conjunto, licencia tal como la publica la fuente, atribución, versión y fecha de consulta.
import { readFileSync, statSync } from 'node:fs';
import { datasetInfo, downloadLayer, layerCopyright } from './arcgis.mjs';
import { CATASTRO, CKAN, OSM_TEXTO, POLIGONO, PORTAL } from './config.mjs';
import { downloadOsm } from './overpass.mjs';

function checkPolygon(text) {
  const json = JSON.parse(text);
  if (!json.geometry?.coordinates || !Array.isArray(json.bbox)) throw new Error('La API no devolvió el polígono con bbox');
}

/** Polígono desde un archivo local: la fecha es la de modificación del archivo (build repetible). */
export function readLocalPolygon(path) {
  const text = readFileSync(path, 'utf8');
  checkPolygon(text);
  return { feature: JSON.parse(text), fecha: statSync(path).mtime.toISOString() };
}

async function fetchPolygon(request) {
  if (!/^https?:/.test(POLIGONO)) return readLocalPolygon(POLIGONO);
  const { text, fecha } = await request(POLIGONO, { validate: checkPolygon, label: 'polígono de El Tintal' });
  return { feature: JSON.parse(text), fecha };
}

const outerRings = (geometry) => (geometry.type === 'Polygon' ? [geometry.coordinates[0]] : geometry.coordinates.map((p) => p[0]));

export async function downloadAll(request, log = console.log) {
  log('Polígono de El Tintal…');
  const { feature, fecha } = await fetchPolygon(request);
  const props = feature.properties ?? {};
  const fuentes = [{
    id: 'poligono', nombre: `Polígono de ${props.nombre ?? 'El Tintal'} (${props.definicion ?? 'UPZ 78 + UPZ 79'})`,
    entidad: 'OpenStreetMap (relaciones de las UPZ), servido por la API del proyecto', servicio: POLIGONO,
    origen: props.source_ref ?? [], licencia: props.license ?? '', atribucion: OSM_TEXTO.atribucion,
    version: props.osm_timestamp ?? '', consultado: fecha,
  }];
  const layers = {};
  for (const [key, layer] of Object.entries(CATASTRO)) {
    log(`Catastro: ${layer.nombre}…`);
    const { features, url, fecha: consultado } = await downloadLayer(request, layer, outerRings(feature.geometry));
    const info = await datasetInfo(request, CKAN, layer.conjunto);
    layers[key] = features;
    fuentes.push({
      id: `catastro-${key}`, nombre: info.titulo, entidad: info.entidad, servicio: url.replace(/\/query$/, ''),
      conjunto: PORTAL + layer.conjunto, licencia: info.licencia, licenciaUrl: info.licenciaUrl,
      atribucion: await layerCopyright(request, layer),
      version: `servicio vigente; última publicación del portal ${info.ultimaVersion} (modificado ${info.modificado})`,
      consultado, entidades: features.length,
    });
  }
  log('OpenStreetMap (Overpass)…');
  const osm = await downloadOsm(request, feature.bbox, log);
  fuentes.push({
    id: 'osm', nombre: 'OpenStreetMap', entidad: 'OpenStreetMap Foundation y colaboradores', servicio: osm.url,
    licencia: OSM_TEXTO.licencia, licenciaUrl: OSM_TEXTO.licenciaUrl, atribucion: OSM_TEXTO.atribucion,
    avisoDelServicio: osm.osm3s.copyright ?? '', version: `datos OSM al ${osm.osm3s.timestamp_osm_base ?? '?'}`,
    consultado: osm.fecha, entidades: osm.elements.length,
  });
  return { feature, layers, osm, fuentes };
}
