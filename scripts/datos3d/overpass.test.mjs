// @vitest-environment node
// Consulta de Overpass: la caja en cada sentencia, geometrías completas y solo lo que usa el script
// (sin `name` a secas, que traía límites de Cundinamarca, Bogotá y las UPZ y rutas de bus).
import { describe, expect, it } from 'vitest';
import { overpassQuery } from './overpass.mjs';

const query = overpassQuery([-74.18, 4.64, -74.14, 4.66]);

describe('overpassQuery', () => {
  it('pone la caja (sur, oeste, norte, este) en cada sentencia y pide las geometrías', () => {
    expect(query.startsWith('[out:json][timeout:300];(')).toBe(true);
    expect(query.endsWith(');out geom;')).toBe(true);
    expect(query).toContain('way["highway"](4.64,-74.18,4.66,-74.14);');
    expect(query).toContain('node["natural"="tree"](4.64,-74.18,4.66,-74.14);');
  });

  it('los nombres, solo con las claves de lugar que usa nombres.mjs', () => {
    expect(query).not.toMatch(/(way|relation)\["name"\]\(/);
    for (const key of ['office', 'tourism', 'healthcare', 'club']) {
      expect(query).toContain(`way["${key}"]["name"](`);
      expect(query).toContain(`relation["${key}"]["name"](`);
    }
    expect(query).toContain('relation["shop"]["name"](');
  });
});
