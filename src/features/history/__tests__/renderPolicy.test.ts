import { describe, expect, it } from 'vitest';
import { shouldRender } from '../hinge/renderPolicy';

const values = [false, true] as const;

describe('shouldRender', () => {
  it.each(values.flatMap((animating) => values.flatMap((hoverDirty) => values.flatMap((hidden) => values.map((inViewport) => [
    animating, hoverDirty, hidden, inViewport,
  ] as const)))))(
    'decide animando=%s, hover=%s, oculto=%s, visible=%s',
    (animating, hoverDirty, hidden, inViewport) => {
      expect(shouldRender({ animating, hoverDirty, hidden, inViewport }))
        .toBe((animating || hoverDirty) && !hidden && inViewport);
    },
  );
});
