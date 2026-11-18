#!/usr/bin/env node
// npm run datos:3d — prepara UNA vez los datos reales de la maqueta 3D de El Tintal en
// public/data/tintal/ (el navegador no consulta servicios externos). Fuentes y uso: README.md.
// Opciones: --refrescar (vuelve a descargar todo, ignorando la caché de DATOS3D_CACHE).
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadBarrio } from './barrio.mjs';
import { PATHS } from './config.mjs';
import { buildingCounts, groundCounts, roadCounts } from './conteos.mjs';
import { buildEdificios } from './edificios.mjs';
import { gzipStable } from './encode.mjs';
import { createProjection, projectionInfo } from './geo.mjs';
import { edificiosFile, puntosFile, sueloFile, viasFile } from './layouts.mjs';
import { buildManifest } from './manifest.mjs';
import { createFetcher } from './net.mjs';
import { splitElements } from './osm.mjs';
import { buildPuntos } from './puntos.mjs';
import { downloadAll } from './sources.mjs';
import { buildSuelo } from './suelo.mjs';
import { buildVias } from './vias.mjs';

const MAX_BYTES = 6 * 1024 * 1024;
const log = (...args) => console.log(...args);

function writeFiles(contents) {
  mkdirSync(PATHS.out, { recursive: true });
  const files = {};
  for (const [name, bytes] of Object.entries(contents)) {
    const packed = gzipStable(bytes);
    const ruta = `${name}.bin.gz`;
    writeFileSync(join(PATHS.out, ruta), packed);
    files[name] = { ruta, bytes: packed.length, bytesTnt3: bytes.length, sha256: createHash('sha256').update(packed).digest('hex') };
  }
  return files;
}

async function main() {
  const request = createFetcher({ cacheDir: PATHS.cache, refresh: process.argv.includes('--refrescar'), log });
  log(`Caché de descargas: ${PATHS.cache}`);
  const { feature, layers, osm: raw, fuentes } = await downloadAll(request, log);
  const project = createProjection(feature.bbox);
  const barrio = loadBarrio(feature, project);
  const osm = splitElements(raw.elements);
  log('Armando capas…');
  const sources = { construcciones: layers.construccion, lotes: layers.lote, placas: layers.placa, sectores: layers.sector };
  const edificios = buildEdificios(sources, osm, barrio, project);
  const vias = buildVias(osm, barrio, project);
  const suelo = buildSuelo(osm, barrio, project, feature.properties?.nombre ?? 'El Tintal');
  const puntos = buildPuntos(osm, barrio, project);
  const files = writeFiles({
    edificios: edificiosFile(edificios.items), vias: viasFile(vias), suelo: sueloFile(suelo), puntos: puntosFile(puntos),
  });
  const conteos = { edificios: buildingCounts(edificios.items), vias: roadCounts(vias), suelo: groundCounts(suelo, puntos) };
  const manifest = buildManifest({ feature, info: projectionInfo(feature.bbox), files, conteos, fuentes });
  const text = `${JSON.stringify(manifest, null, 2)}\n`;
  writeFileSync(join(PATHS.out, 'manifest.json'), text);
  const total = Object.values(files).reduce((t, f) => t + f.bytes, 0) + Buffer.byteLength(text);
  log(JSON.stringify({ armado: { edificios: edificios.stats, suelo: suelo.stats }, conteos }, null, 2));
  for (const f of Object.values(files)) log(`${f.ruta}: ${f.bytes} bytes (${f.bytesTnt3} sin comprimir)`);
  log(`manifest.json: ${Buffer.byteLength(text)} bytes · total ${total} bytes (${(total / 1048576).toFixed(2)} MB)`);
  if (total > MAX_BYTES) throw new Error(`Los datos pesan ${total} bytes y la meta es ≤ ${MAX_BYTES}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
