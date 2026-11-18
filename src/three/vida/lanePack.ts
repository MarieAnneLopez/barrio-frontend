import type { Draft, EdgeDraft } from './laneDraft';
import type { LaneGraph } from './laneGraph';

// Empaca el borrador del grafo de carriles en arreglos tipados (un bucle por cuadro los recorre).

type Key = keyof EdgeDraft;

export function packLaneGraph(d: Draft, nodes: number): LaneGraph {
  const f32 = (key: Key) => Float32Array.from(d.edges, (e) => e[key]);
  const i32 = (key: Key) => Int32Array.from(d.edges, (e) => e[key]);
  const u8 = (key: Key) => Uint8Array.from(d.edges, (e) => e[key]);
  const vertex = (k: number) => Float32Array.from({ length: d.verts.length / 6 }, (_, i) => d.verts[6 * i + k] ?? 0);
  const pairs = (a: number, b: number) => Float32Array.from({ length: d.verts.length / 3 }, (_, i) => d.verts[6 * (i >> 1) + ((i & 1) === 0 ? a : b)] ?? 0);
  const start = new Uint32Array(d.edges.length + 1);
  d.edges.forEach((e, i) => (start[i + 1] = (start[i] ?? 0) + e.count));
  const from = i32('from');
  const length = f32('length');
  const weight = f32('weight');
  return {
    edges: d.edges.length, start, xz: pairs(0, 1), y: vertex(2), cum: vertex(3), nrm: pairs(4, 5),
    length, from, to: i32('to'), way: i32('way'), forward: u8('forward'), reverse: i32('reverse'), lanes: u8('lanes'),
    offset0: f32('offset0'), laneStep: f32('laneStep'), speed: f32('speed'), weight,
    trimStart: f32('trimStart'), trimEnd: f32('trimEnd'), ...outgoing(from, nodes), spawn: spawnWeights(length, weight),
  };
}

function outgoing(from: Int32Array, nodes: number): { outFirst: Uint32Array; outList: Int32Array } {
  const outFirst = new Uint32Array(nodes + 1);
  from.forEach((n) => (outFirst[n + 1] = (outFirst[n + 1] ?? 0) + 1));
  for (let n = 0; n < nodes; n++) outFirst[n + 1] = (outFirst[n + 1] ?? 0) + (outFirst[n] ?? 0);
  const cursor = outFirst.slice(0, nodes);
  const outList = new Int32Array(from.length);
  from.forEach((n, e) => {
    outList[cursor[n] ?? 0] = e;
    cursor[n] = (cursor[n] ?? 0) + 1;
  });
  return { outFirst, outList };
}

function spawnWeights(length: Float32Array, weight: Float32Array): Float32Array {
  const out = new Float32Array(length.length);
  let total = 0;
  length.forEach((l, e) => (out[e] = total += l * (weight[e] ?? 0)));
  return out;
}
