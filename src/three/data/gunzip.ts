// gzip → bytes con DecompressionStream (navegador y Web Worker, sin dependencias). Si el servidor ya
// los entregó descomprimidos (Content-Encoding: gzip), no traen la firma 1f 8b y pasan tal cual.
export async function gunzip(bytes: Uint8Array<ArrayBuffer>): Promise<ArrayBuffer> {
  if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) return bytes.slice().buffer;
  const body = new Response(bytes).body;
  if (!body) throw new Error('No hay datos que descomprimir');
  return new Response(body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
}
