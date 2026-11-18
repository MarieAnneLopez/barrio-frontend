import { describe, expect, it } from 'vitest';
import { DOWN_AFTER_MS, initialQuality, nextQuality, UP_AFTER_MS, type QualityTrack } from './qualityPolicy';

const run = (start: QualityTrack, fps: number, totalMs: number, stepMs = 500) => {
  let track = start;
  for (let t = 0; t < totalMs; t += stepMs) track = nextQuality(track, fps, stepMs);
  return track;
};

describe('calidad adaptable', () => {
  it('baja un nivel si el equipo no llega a 42 fps durante 2,5 s', () => {
    expect(run({ level: 2, lowMs: 0, highMs: 0 }, 30, DOWN_AFTER_MS).level).toBe(1);
    expect(run({ level: 2, lowMs: 0, highMs: 0 }, 30, DOWN_AFTER_MS - 500).level).toBe(2);
  });

  it('nunca baja de 0 ni sube de 2', () => {
    expect(run({ level: 0, lowMs: 0, highMs: 0 }, 10, 20_000).level).toBe(0);
    expect(run({ level: 2, lowMs: 0, highMs: 0 }, 60, 60_000).level).toBe(2);
  });

  it('sube despacio: solo tras 12 s seguidos sobrados', () => {
    expect(run({ level: 1, lowMs: 0, highMs: 0 }, 60, UP_AFTER_MS - 500).level).toBe(1);
    expect(run({ level: 1, lowMs: 0, highMs: 0 }, 60, UP_AFTER_MS).level).toBe(2);
  });

  it('un bache corto no cambia nada: el contador se reinicia', () => {
    let track: QualityTrack = { level: 2, lowMs: 0, highMs: 0 };
    for (let i = 0; i < 20; i++) track = nextQuality(nextQuality(track, 30, 2000), 55, 500);
    expect(track.level).toBe(2);
  });

  it('los móviles y los equipos con poca memoria arrancan más abajo', () => {
    expect(initialQuality({ coarsePointer: false, width: 1440, memoryGb: 8, cores: 8 })).toBe(2);
    expect(initialQuality({ coarsePointer: true, width: 390, memoryGb: undefined, cores: 8 })).toBe(1);
    expect(initialQuality({ coarsePointer: false, width: 1440, memoryGb: 2, cores: 8 })).toBe(0);
  });
});
