// Tipos del codificador TNT3 para las pruebas TypeScript del decodificador.
export interface SectionInput {
  id: string;
  type: 'u8' | 'i8' | 'u16' | 'i16' | 'u32' | 'i32' | 'f32' | 'f64' | 'utf8';
  data: ArrayLike<number> | string[];
}
export declare const VERSION: number;
export declare const SCALE: number;
export declare function quantize(meters: number): number;
export declare function deltaEncode(sequences: readonly (readonly (readonly number[])[])[]): Int16Array<ArrayBuffer>;
export declare function writeContainer(kind: number, sections: SectionInput[]): Uint8Array<ArrayBuffer>;
export declare function gzipStable(bytes: Uint8Array): Uint8Array<ArrayBuffer>;
