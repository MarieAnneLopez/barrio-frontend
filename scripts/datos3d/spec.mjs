// Códigos compartidos con el decodificador (src/three/data/tnt3.json): una sola fuente de verdad
// para tipos de sección, clases y banderas.
import { readFileSync } from 'node:fs';

export const SPEC = JSON.parse(readFileSync(new URL('../../src/three/data/tnt3.json', import.meta.url), 'utf8'));
