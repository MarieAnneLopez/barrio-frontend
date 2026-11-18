// Tipos del fixture para las pruebas TypeScript del decodificador.
export type FixtureFile = 'edificios' | 'vias' | 'suelo' | 'puntos';
export declare function buildFixture(): Record<FixtureFile, Uint8Array<ArrayBuffer>>;
