import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// three (~1 MB) no puede ir en el trozo de la Galería: se sigue el grafo de importaciones estáticas,
// como hace el empaquetador, y se comprueba que la página no llega a three; solo llega el import()
// dinámico del motor, que el navegador pide cuando la cinta se acerca y hay WebGL 2.
const here = dirname(fileURLToPath(import.meta.url));
const STATIC_IMPORT = /^[ \t]*(?:import|export)\s+(?:[^'"()]*?\s+from\s+)?['"]([^'"]+)['"]/gm;
const isFile = (path: string) => existsSync(path) && statSync(path).isFile();

function staticGraph(entry: string) {
  const [files, packages] = [new Set<string>(), new Set<string>()];
  const queue = [entry];
  for (let file = queue.pop(); file !== undefined; file = queue.pop()) {
    if (files.has(file)) continue;
    files.add(file);
    if (!/\.tsx?$/.test(file)) continue;
    for (const [, target = ''] of readFileSync(file, 'utf8').matchAll(STATIC_IMPORT)) {
      if (!target.startsWith('.')) {
        packages.add(target);
        continue;
      }
      const base = resolve(dirname(file), target);
      const found = [base, `${base}.ts`, `${base}.tsx`, join(base, 'index.ts')].find(isFile);
      if (found) queue.push(found);
    }
  }
  return { files: [...files], packages: [...packages] };
}
const usesThree = (name: string) => name === 'three' || name.startsWith('three/') || name.startsWith('@react-three/');

describe('three queda fuera del trozo de la Galería', () => {
  const page = staticGraph(join(here, '..', 'GalleryPage.tsx'));

  it('el rastreo recorre de verdad el grafo de la página y de la cinta', () => {
    const names = page.files.map((file) => file.slice(here.length + 1));
    expect(names).toEqual(expect.arrayContaining(['PhotoRibbon.tsx', 'useRibbon.ts', 'RibbonGrid.tsx', 'ribbonContract.ts', 'ribbonPhotos.ts']));
    expect(page.packages).toEqual(expect.arrayContaining(['react', 'react-i18next']));
  });

  it('nada de lo que la página importa de forma estática llega a three', () => {
    expect(page.packages.filter(usesThree)).toEqual([]);
    expect(page.files.filter((file) => /ribbon(Engine|View|Scene|Slots|Shader|Floor|Textures)\.ts$/.test(file))).toEqual([]);
  });

  it('ScrollTrigger tampoco: al registrarse deja un rAF, un intervalo y oyentes globales toda la sesión', () => {
    expect(page.packages).not.toContain('gsap/ScrollTrigger');
  });

  it('el motor (y three con él) solo se pide con import() dinámico', () => {
    expect(readFileSync(join(here, 'useRibbon.ts'), 'utf8')).toMatch(/[^.\w]import\('\.\/ribbonEngine'\)/);
    expect(staticGraph(join(here, 'ribbonEngine.ts')).packages.filter(usesThree)).toEqual(['three']); // por ahí sí llega
  });
});
