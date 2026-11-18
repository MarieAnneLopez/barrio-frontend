// El único requestAnimationFrame de la cinta. Solo corre mientras se ve (lo dice el IntersectionObserver
// de quien lo usa), con la pestaña visible y mientras haya movimiento: quieta, no pide cuadros. Al
// volver de una pausa el primer cuadro llega con dt = 0, así que el tiempo parado no se acumula.
import { MAX_DT } from './ribbonMotion';

export interface Loop {
  /** La cinta entra o sale de pantalla. */
  setVisible(visible: boolean): void;
  /** Hay algo nuevo que dibujar: pide un cuadro si no hay ninguno pedido. */
  wake(): void;
  dispose(): void;
}

/**
 * `frame` recibe los segundos desde el cuadro anterior (0 en el primero, 0,05 como mucho) y devuelve
 * si queda algo por animar: con `false` el bucle se detiene hasta el próximo wake().
 */
export function createLoop(frame: (dt: number) => boolean): Loop {
  let [request, last] = [0, 0];
  let [visible, disposed, drawing, woken] = [false, false, false, false];
  const active = () => visible && !disposed && !document.hidden;

  const tick = (now: number) => {
    request = 0;
    const dt = last === 0 ? 0 : Math.min((now - last) / 1000, MAX_DT);
    last = now;
    [drawing, woken] = [true, false];
    let more: boolean;
    try {
      more = frame(dt);
    } finally {
      drawing = false; // un cuadro que falla no deja el bucle sordo a los siguientes wake()
    }
    if ((more || woken) && active()) request = requestAnimationFrame(tick);
    else last = 0;
  };

  /** Arranca o detiene según el estado; nunca deja más de un cuadro pedido. */
  const sync = () => {
    if (drawing) {
      woken = true; // lo resuelve el cuadro en curso al terminar, sin reiniciar el reloj
      return;
    }
    if (active()) {
      if (request === 0) {
        last = 0;
        request = requestAnimationFrame(tick);
      }
      return;
    }
    if (request !== 0) cancelAnimationFrame(request);
    [request, last] = [0, 0];
  };

  document.addEventListener('visibilitychange', sync);
  return {
    setVisible(next) {
      visible = next;
      sync();
    },
    wake: sync,
    dispose() {
      disposed = true;
      sync();
      document.removeEventListener('visibilitychange', sync);
    },
  };
}
