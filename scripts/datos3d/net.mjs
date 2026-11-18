// Descargas con caché en disco y reintentos: cada respuesta válida se guarda una vez (cuerpo +
// metadatos con la fecha), así repetir el build no vuelve a consultar los servicios.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { USER_AGENT } from './config.mjs';

const RETRY_STATUS = new Set([429, 500, 502, 503, 504]);
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

function save(file, text, meta) {
  writeFileSync(`${file}.part`, text);
  renameSync(`${file}.part`, `${file}.body`);
  writeFileSync(`${file}.json`, JSON.stringify(meta, null, 2));
}

/**
 * request(url, { form, validate }) → { text, fecha }. `form` hace un POST de formulario; `validate`
 * recibe el texto y lanza si la respuesta no sirve (no se guarda y se reintenta). Con `cacheOnly`
 * devuelve null si no hay copia guardada, sin tocar la red.
 */
export function createFetcher({ cacheDir, refresh = false, log = console.log, retries = 6, backoffMs = 5000 }) {
  mkdirSync(cacheDir, { recursive: true });
  return async function request(url, { form, validate = () => {}, label = url, cacheOnly = false } = {}) {
    const body = form ? new URLSearchParams(form).toString() : '';
    const file = join(cacheDir, createHash('sha256').update(`${url}\n${body}`).digest('hex').slice(0, 24));
    if (!refresh && existsSync(`${file}.body`) && existsSync(`${file}.json`)) {
      const meta = JSON.parse(readFileSync(`${file}.json`, 'utf8'));
      return { text: readFileSync(`${file}.body`, 'utf8'), fecha: meta.fecha };
    }
    if (cacheOnly) return null;
    let last = 'sin respuesta';
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          method: form ? 'POST' : 'GET',
          headers: { 'User-Agent': USER_AGENT, ...(form && { 'Content-Type': 'application/x-www-form-urlencoded' }) },
          ...(form && { body }),
          signal: AbortSignal.timeout(300_000),
        });
        const text = await response.text();
        if (response.ok) {
          validate(text);
          const fecha = new Date().toISOString();
          save(file, text, { url, formulario: form ? Object.keys(form) : null, fecha, bytes: text.length });
          return { text, fecha };
        }
        last = `HTTP ${response.status}`;
        if (!RETRY_STATUS.has(response.status)) break;
      } catch (error) {
        last = error instanceof Error ? error.message : String(error);
      }
      if (attempt < retries) {
        log(`  ${label}: ${last}; reintento ${attempt} de ${retries - 1}`);
        await sleep(backoffMs * 2 ** (attempt - 1));
      }
    }
    throw new Error(`${label}: falló tras ${retries} intentos (${last})`);
  };
}
