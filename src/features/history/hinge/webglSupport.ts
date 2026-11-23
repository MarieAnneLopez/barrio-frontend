/** three 0.172 solo renderiza con WebGL 2: con WebGL 1 la línea de tiempo usa el camino de siempre. */
export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2');
    context?.getExtension?.('WEBGL_lose_context')?.loseContext();
    return Boolean(context);
  } catch {
    return false;
  }
}
