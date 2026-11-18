// Lo que hace el Web Worker: pide el manifiesto y los cuatro .bin.gz al mismo origen, los
// descomprime, los decodifica y lista los buffers que se pueden transferir sin copiar.
import { FormatError } from './container';
import { decodeEdificios, decodePuntos, decodeSuelo, decodeVias } from './decode';
import { TNT3, type Tintal3D, type TintalFile, type TintalManifest } from './format';
import { gunzip } from './gunzip';

const FILES: TintalFile[] = ['edificios', 'vias', 'suelo', 'puntos'];

async function get(fetcher: typeof fetch, url: URL, init?: RequestInit): Promise<Response> {
  const response = await fetcher(url, init);
  if (!response.ok) throw new Error(`HTTP ${response.status} al pedir ${url.pathname}`);
  return response;
}

async function fetchFile(fetcher: typeof fetch, base: string, manifest: TintalManifest, file: TintalFile) {
  const entry = manifest.archivos[file];
  const url = new URL(entry.ruta, base);
  url.searchParams.set('v', entry.sha256.slice(0, 12)); // un manifiesto nuevo nunca usa archivos viejos de caché
  const plain = await gunzip(new Uint8Array(await (await get(fetcher, url)).arrayBuffer()));
  if (plain.byteLength !== entry.bytesTnt3) {
    throw new FormatError(`${file}: ${plain.byteLength} bytes y el manifiesto dice ${entry.bytesTnt3}`);
  }
  return plain;
}

/** `base`: URL absoluta de la carpeta de datos (termina en /), p. ej. https://…/data/tintal/. */
export async function loadTintal3D(base: string, fetcher: typeof fetch = fetch): Promise<Tintal3D> {
  const manifest = (await (await get(fetcher, new URL('manifest.json', base), { cache: 'no-cache' })).json()) as TintalManifest;
  if (manifest.version !== TNT3.version) {
    throw new FormatError(`Manifiesto versión ${manifest.version}; este decodificador lee la ${TNT3.version}`);
  }
  const [edificios, vias, suelo, puntos] = await Promise.all(FILES.map((f) => fetchFile(fetcher, base, manifest, f)));
  if (!edificios || !vias || !suelo || !puntos) throw new FormatError('Faltan archivos de datos 3D');
  return {
    manifest, edificios: decodeEdificios(edificios), vias: decodeVias(vias),
    suelo: decodeSuelo(suelo), puntos: decodePuntos(puntos),
  };
}

/** Buffers de todos los arreglos tipados, sin repetir, para postMessage(data, transfer). */
export function transferables(value: unknown): ArrayBuffer[] {
  const found = new Set<ArrayBuffer>();
  const walk = (item: unknown): void => {
    if (ArrayBuffer.isView(item)) {
      if (item.buffer instanceof ArrayBuffer) found.add(item.buffer);
    } else if (item && typeof item === 'object') {
      Object.values(item).forEach(walk);
    }
  };
  walk(value);
  return [...found];
}
