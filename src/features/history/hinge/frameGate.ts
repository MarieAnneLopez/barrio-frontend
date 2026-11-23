import { shouldRender } from './renderPolicy';

export function createFrameGate(canvas: HTMLCanvasElement, invalidate: () => void) {
  let inViewport = false;
  let dirty = true;
  const pending = (animating: boolean) => shouldRender({
    animating, hoverDirty: dirty, hidden: document.hidden, inViewport,
  });
  function refresh() {
    dirty = true;
    if (pending(false)) invalidate();
  }
  const observer = new IntersectionObserver(entries => {
    const entry = entries[entries.length - 1];
    inViewport = entry?.isIntersecting ?? false;
    refresh();
  });
  observer.observe(canvas);
  document.addEventListener('visibilitychange', refresh);
  return {
    refresh, pending,
    painted(animating: boolean) {
      dirty = false;
      if (pending(animating)) invalidate();
    },
    dispose() {
      inViewport = false;
      observer.disconnect();
      document.removeEventListener('visibilitychange', refresh);
    },
  };
}
