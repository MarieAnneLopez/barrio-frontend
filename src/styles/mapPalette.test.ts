import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// D83 (pedido de Marie): un solo tema para todos los mapas, con los colores medidos en la
// referencia; dentro de los mapas no hay violeta. La interfaz sigue en violeta.
const src = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => readFileSync(join(src, file), 'utf8');
const theme = read('styles/map-palette.css');

/** k-means (k = 8, Lab) sobre la zona de mapa de "Barrio 3d ejemplo.jpeg", por peso. */
const MEASURED = ['#1f3a5f', '#1a273a', '#3e5c78', '#758ea6', '#625f61', '#152b20', '#bbbab4', '#33593f'];
const VIOLETS = ['af50e5', '8a0bd2', 'd980f9', 'e2cef6', '5b0672'];
const MAP_STYLE_FILES = [
  'styles/map-palette.css', 'components/map/map.css', 'components/map/marker.css', 'components/map/baseStyle.ts',
  'components/map/shapeFill.ts', 'components/map/useShapes.ts', 'features/home/LegendMarker.tsx',
  // Toda la maqueta 3D (src/three), sin pruebas: los carriles agregan y quitan archivos sin tocar esta lista.
  ...readdirSync(join(src, 'three'), { recursive: true, encoding: 'utf8' })
    .filter((f) => /\.(tsx?|css)$/.test(f) && !/\.test\./.test(f))
    .map((f) => `three/${f.replaceAll('\\', '/')}`),
];

function hueSat(hex: string): { h: number; s: number } {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (!d) return { h: 0, s: 0 };
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s: d / (1 - Math.abs(max + min - 1)) };
}

describe('tema único de los mapas (D83)', () => {
  it('sus 8 colores son exactamente los medidos en la referencia', () => {
    const refs = [...theme.matchAll(/--map-ref-(\d): (#[0-9a-f]{6});/g)].map((m) => m[2]);
    expect(refs).toEqual(MEASURED);
  });

  it('cada rol apunta a un color medido: ningún rol trae un hex propio', () => {
    const roles = [...theme.matchAll(/--map-([a-z-]+): ([^;]+);/g)].filter((m) => !/^(ref|dia|ciclo)-/.test(m[1] ?? ''));
    expect(roles.length).toBeGreaterThanOrEqual(14);
    for (const [, name, value] of roles) expect(value, `--map-${name}`).toMatch(/^var\(--map-ref-[1-8]\)$/);
  });

  it('ningún color del tema es violeta (matiz 250–330° con saturación > 15 %)', () => {
    for (const hex of MEASURED) {
      const { h, s } = hueSat(hex);
      expect(h >= 250 && h <= 330 && s > 0.15, `${hex}: ${h.toFixed(0)}°`).toBe(false);
    }
  });

  it('el ciclo de día y noche (D106) trae su propio hex, sin violeta y atado a la interfaz', () => {
    const cycle = [...theme.matchAll(/--map-((?:dia|ciclo)-[a-z-]+): (#[0-9a-f]{6});/g)];
    expect(cycle.length).toBe(27);
    for (const [, name, hex = ''] of cycle) {
      const { h, s } = hueSat(hex);
      expect(h >= 250 && h <= 330 && s > 0.15, `--map-${name}: ${h.toFixed(0)}°`).toBe(false);
    }
    const pick = (name: string) => cycle.find((m) => m[1] === name)?.[2];
    expect([pick('dia-horizonte'), pick('ciclo-atardecer'), pick('ciclo-sol')]).toEqual(['#fcf0cf', '#f6a7c1', '#fdcf76']);
  });

  it('los archivos de estilo de mapa no contienen ninguno de los 5 hex violetas de la interfaz', () => {
    for (const file of MAP_STYLE_FILES) {
      const text = read(file).toLowerCase();
      for (const violet of VIOLETS) expect(text.includes(violet), `${file}: #${violet}`).toBe(false);
    }
  });
});
