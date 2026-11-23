import type { RenderInput } from './types';

export function shouldRender(input: RenderInput): boolean {
  return (input.animating || input.hoverDirty) && !input.hidden && input.inViewport;
}
