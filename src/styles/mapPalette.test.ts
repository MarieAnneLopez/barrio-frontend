import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// D82 (pedido de Marie): dentro de los mapas no hay violeta; la interfaz sigue en violeta.
const src = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => readFileSync(join(src, file), 'utf8');

const VIOLETS = ['af50e5', '8a0bd2', 'd980f9', 'e2cef6', '5b0672'];
const MAP_STYLE_FILES = [
  'styles/map-palette.css', 'components/map/map.css', 'components/map/marker.css', 'components/map/baseStyle.ts',
  'components/map/shapeFill.ts', 'features/home/LegendMarker.tsx',
  'components/map/useShapes.ts', 'features/modules/maps-preview.css', 'three/sceneColors.ts',
  'three/shapeStyle.ts', 'three/emojiTexture.ts', 'three/PlaceLayers.tsx', 'three/GroundLayer.tsx',
  'three/RoadsLayer.tsx', 'three/BuildingsLayer.tsx', 'three/Particles.tsx', 'three/TintalScene.tsx',
];

function hue(hex: string): { h: number; s: number } {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (!d) return { h: 0, s: 0 };
  const l = (max + min) / 2;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s: d / (1 - Math.abs(2 * l - 1)) };
}

describe('paleta de los mapas (D82)', () => {
  it('los archivos de estilo de mapa no contienen ninguno de los 5 hex violetas', () => {
    for (const file of MAP_STYLE_FILES) {
      const text = read(file).toLowerCase();
      for (const violet of VIOLETS) expect(text.includes(violet), `${file}: #${violet}`).toBe(false);
    }
  });

  it('todos los colores de la paleta del mapa son verdes o blanco (nunca matiz 250–330°)', () => {
    const hexes = [...read('styles/map-palette.css').matchAll(/--map-[a-z]+:\s*#([0-9a-f]{6})/gi)].map((m) => m[1] ?? '');
    expect(hexes.length).toBe(10);
    for (const hex of hexes) {
      const { h, s } = hue(hex);
      expect(s === 0 || (h >= 130 && h <= 165), `#${hex}: ${h.toFixed(0)}°`).toBe(true);
    }
  });
});
