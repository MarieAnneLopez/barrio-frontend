import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// three (~1 MB) no puede ir en el trozo inicial del sitio: el Inicio no es una ruta diferida. Aquí
// se sigue el grafo de importaciones estáticas, como hace el empaquetador, y se comprueba que el
// punto de entrada del capítulo no llega a three; solo se llega por el import() dinámico del motor.
const here = dirname(fileURLToPath(import.meta.url));
/** `import … from 'x'`, `import 'x'` y `export … from 'x'` (también los de solo tipos); no los import() dinámicos. */
const STATIC_IMPORT = /^[ \t]*(?:import|export)\s+(?:[^'"()]*?\s+from\s+)?['"]([^'"]+)['"]/gm;
const isFile = (path: string) => existsSync(path) && statSync(path).isFile();

/** Archivos y paquetes alcanzables desde `entry` solo con importaciones estáticas. */
function staticGraph(entry: string) {
  const files = new Set<string>();
  const packages = new Set<string>();
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

describe('three queda fuera del trozo inicial', () => {
  const entry = staticGraph(join(here, 'ModuleReel.tsx'));

  it('el rastreo recorre de verdad el grafo del capítulo', () => {
    const names = entry.files.map((file) => file.slice(here.length + 1));
    expect(names).toEqual(expect.arrayContaining(['ModuleReel.tsx', 'useModuleReel.ts', 'ReelGrid.tsx', 'reelContract.ts', 'coverLayout.ts']));
    expect(entry.packages).toEqual(expect.arrayContaining(['react', 'react-router-dom', 'react-i18next']));
  });

  it('nada de lo que ModuleReel importa de forma estática llega a three', () => {
    expect(entry.packages.filter(usesThree)).toEqual([]);
    const offenders = entry.files.filter((file) => /\.tsx?$/.test(file) && /from\s+['"]three['"/]/.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('el motor (y three con él) solo se pide con import() dinámico', () => {
    const engine = join(here, 'reelEngine.ts');
    expect(entry.files).not.toContain(engine);
    expect(readFileSync(join(here, 'useModuleReel.ts'), 'utf8')).toMatch(/[^.\w]import\('\.\/reelEngine'\)/);
    expect(staticGraph(engine).packages.filter(usesThree)).toEqual(['three']); // por ahí sí llega
  });

  it('ni la rejilla ni las pruebas de la app necesitan cargar el motor', () => {
    const grid = staticGraph(join(here, 'ReelGrid.tsx'));
    expect(grid.packages.filter(usesThree)).toEqual([]);
    expect(grid.files.some((file) => /reel(Engine|View|Scene)|cardShader|coverTexture/.test(file))).toBe(false);
  });
});
