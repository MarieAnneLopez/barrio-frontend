// Solo para pruebas (entorno node): los datos reales comitidos en public/data/tintal, decodificados.
import { readFile } from 'node:fs/promises';
import { decodePuntos, decodeSuelo, decodeVias } from '../three/data/decode';
import type { Puntos, Suelo, TintalFile, TintalManifest, Vias } from '../three/data/format';
import { gunzip } from '../three/data/gunzip';

const dir = new URL('../../public/data/tintal/', import.meta.url);

async function plain(file: TintalFile): Promise<ArrayBuffer> {
  const manifest = JSON.parse(await readFile(new URL('manifest.json', dir), 'utf8')) as TintalManifest;
  return gunzip(new Uint8Array(await readFile(new URL(manifest.archivos[file].ruta, dir))));
}

export const realVias = async (): Promise<Vias> => decodeVias(await plain('vias'));
export const realSuelo = async (): Promise<Suelo> => decodeSuelo(await plain('suelo'));
export const realPuntos = async (): Promise<Puntos> => decodePuntos(await plain('puntos'));
