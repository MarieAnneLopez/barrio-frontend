// El único requestAnimationFrame del capítulo. Solo corre mientras el reel se ve (lo dice el
// IntersectionObserver de quien lo usa) y el documento está visible; al volver de una pausa el
// primer cuadro llega con dt = 0, así que el tiempo parado no se acumula.
import { MAX_DT } from './reelPhase';

export interface Loop {
  /** El capítulo entra o sale de pantalla. */
  setVisible(visible: boolean): void;
  /** Hay algo nuevo que dibujar (una entrada, un cambio de tamaño): pide un cuadro si no hay ninguno. */
  wake(): void;
  dispose(): void;
}

/**
 * `frame` recibe los segundos desde el cuadro anterior (0 en el primero, 0,05 como mucho) y devuelve
 * si queda algo por animar: con `false` el bucle se detiene hasta el próximo wake().
 */
export function createLoop(frame: (dt: number) => boolean): Loop {
  let request = 0;
  let last = 0;
  let visible = false;
  let disposed = false;
  let drawing = false;
  let woken = false;

  const active = () => visible && !disposed && !document.hidden;

  const tick = (now: number) => {
    request = 0;
    const dt = last === 0 ? 0 : Math.min((now - last) / 1000, MAX_DT);
    last = now;
    drawing = true;
    woken = false;
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
    request = 0;
    last = 0;
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
