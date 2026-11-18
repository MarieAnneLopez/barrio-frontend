// @vitest-environment node
// Verifica la salida real de build_brand_assets.mjs: el logo (rostro sonriente de Mini Marie) en
// sus tamaños exactos y el favicon en la paleta de la interfaz elegante (D84), ya sin violeta.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pub = (path) => join(root, 'public', path);
const PAPEL = [232, 216, 201];
const ACERO = [75, 96, 127];
const near = (a, b, tolerance = 6) => a.every((value, i) => Math.abs(value - b[i]) <= tolerance);

/** Píxeles RGBA de una imagen y un lector por coordenada. */
async function pixels(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const at = (x, y) => [...data.subarray((y * info.width + x) * 4, (y * info.width + x) * 4 + 4)];
  return { data, info, at };
}

describe('logo de Mini Marie (D82, D86)', () => {
  it.each([32, 48, 64, 96])('marie-logo-%i.png es cuadrado, de ese tamaño y con transparencia', async (size) => {
    const meta = await sharp(pub(`assets/brand/marie-logo-${size}.png`)).metadata();
    expect([meta.width, meta.height, meta.hasAlpha]).toEqual([size, size, true]);
  });
});

/** Píxeles visibles en base64: bajo alfa 0 el color no se ve (y WebP sin pérdida no lo guarda). */
function visible(raw) {
  const out = Buffer.from(raw);
  for (let i = 0; i < out.length; i += 4) if (out[i + 3] === 0) out.fill(0, i, i + 3);
  return out.toString('base64');
}

/** Las 32 celdas de un atlas de 8 × 4, como píxeles visibles (para compararlas). */
async function cells(size) {
  const file = pub(`assets/brand/marie-face-${size}.webp`);
  const out = [];
  for (let n = 0; n < 32; n += 1) {
    const box = { left: (n % 8) * size, top: Math.floor(n / 8) * size, width: size, height: size };
    out.push(visible(await sharp(file).extract(box).ensureAlpha().raw().toBuffer()));
  }
  return out;
}

// Auditoría MM-04: el logo era un PNG fijo de un cuadro; ahora respira con el ciclo de reposo.
describe('logo animado: el ciclo de reposo de 32 cuadros recortado al rostro', () => {
  it.each([32, 48, 64, 96])('marie-face-%i.webp es un atlas de 8 × 4 cuadros de ese tamaño, con transparencia', async (size) => {
    const meta = await sharp(pub(`assets/brand/marie-face-${size}.webp`)).metadata();
    expect([meta.width, meta.height, meta.hasAlpha]).toEqual([8 * size, 4 * size, true]);
  });

  it.each([32, 48, 64, 96])('el póster de %i px es idéntico al primer cuadro: al empezar el ciclo no se nota', async (size) => {
    const poster = await sharp(pub(`assets/brand/marie-logo-${size}.png`)).ensureAlpha().raw().toBuffer();
    expect(visible(poster)).toBe((await cells(size))[0]);
  });

  it('respira: cambia de cuadro, y los cuadros sostenidos del reposo quedan idénticos (sin pérdida)', async () => {
    const distinct = new Set(await cells(96)).size;
    expect(distinct).toBeGreaterThan(4);
    expect(distinct).toBeLessThan(32);
  });
});

describe('favicon en la paleta nueva (D84)', () => {
  it.each([32, 48])('favicon-%i.png: círculo papel con aro acero, sin violeta', async (size) => {
    const { data, info, at } = await pixels(pub(`favicon-${size}.png`));
    expect([info.width, info.height]).toEqual([size, size]);
    expect(at(0, 0)[3]).toBe(0); // fuera del círculo: transparente
    expect(near(at(size / 2, 0).slice(0, 3), ACERO, 24)).toBe(true); // el aro, arriba al centro
    let [violet, papel] = [0, 0];
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b, a] = data.subarray(i, i + 4);
      if (a > 200 && (near([r, g, b], [226, 206, 246]) || near([r, g, b], [91, 6, 114]))) violet += 1;
      if (a > 200 && near([r, g, b], PAPEL)) papel += 1;
    }
    expect(violet).toBe(0);
    expect(papel).toBeGreaterThan(size); // el fondo papel asoma sobre el pelo
  });

  it('el color de la barra del navegador es el rosa de la cabecera (D100)', () => {
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toContain('<meta name="theme-color" content="#F6A7C1" />');
  });
});
