import { Raycaster, Vector2, type Camera, type Mesh } from 'three';

export function watchPanelHover(canvas: HTMLCanvasElement, camera: Camera, panels: Mesh[], refresh: () => void) {
  const media = window.matchMedia('(hover: hover) and (pointer: fine)');
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  let overCanvas = false;
  let selected: Mesh | undefined;

  function pick() {
    if (!overCanvas || !media.matches) return undefined;
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects<Mesh>(panels, false)[0]?.object;
  }
  function update() {
    const next = pick();
    if (next === selected) return;
    selected = next;
    refresh();
  }
  function move(event: PointerEvent) {
    if (event.pointerType === 'touch') return;
    const rect = canvas.getBoundingClientRect();
    pointer.set(2 * (event.clientX - rect.left) / rect.width - 1, 1 - 2 * (event.clientY - rect.top) / rect.height);
    overCanvas = true;
    update();
  }
  function leave() {
    overCanvas = false;
    update();
  }
  function disconnect() {
    canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerleave', leave);
    leave();
  }
  function connect() {
    disconnect();
    if (!media.matches) return;
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerleave', leave);
  }
  connect();
  media.addEventListener('change', connect);
  return {
    current() {
      selected = pick();
      return selected;
    },
    dispose() {
      media.removeEventListener('change', connect);
      disconnect();
    },
  };
}
