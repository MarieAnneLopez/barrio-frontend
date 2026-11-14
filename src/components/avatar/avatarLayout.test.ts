import { describe, expect, it } from 'vitest';
import atlas from './atlas.json';
import { avatarLayout } from './avatarLayout';

describe('avatarLayout', () => {
  const layout = avatarLayout(200);
  const scale = layout.frames[1] ? layout.frames[1].height / (atlas.frames[0]?.h ?? 1) : 0;

  it('mide la altura pedida y contiene todas las poses', () => {
    expect(layout.height).toBe(200);
    for (const placement of Object.values(layout.frames)) {
      expect(placement.left).toBeGreaterThanOrEqual(0);
      expect(placement.top).toBeGreaterThanOrEqual(-0.01);
      expect(placement.left + placement.width).toBeLessThanOrEqual(layout.width + 0.01);
    }
  });

  it('las poses 1–5 apoyan los pies en el mismo punto (sin saltos al cambiar de frame)', () => {
    const feet = atlas.frames.slice(0, 5).map((frame, i) => {
      const p = layout.frames[i + 1];
      return p ? { x: p.left + frame.footX * scale, y: p.top + (frame.footY + frame.offsetY) * scale } : null;
    });
    const [first] = feet;
    for (const foot of feet) {
      expect(foot?.x).toBeCloseTo(first?.x ?? 0, 5);
      expect(foot?.y).toBeCloseTo(first?.y ?? 0, 5);
    }
  });

  it('jump queda en el aire según su offsetY medido', () => {
    const jump = atlas.frames[5];
    const placement = layout.frames[6];
    expect(jump && placement).toBeTruthy();
    if (!jump || !placement) return;
    const feetY = placement.top + jump.footY * scale;
    expect(layout.height - feetY).toBeCloseTo(jump.offsetY * scale, 5);
  });
});
