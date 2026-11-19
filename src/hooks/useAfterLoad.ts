import { useEffect, useState } from 'react';

/**
 * true cuando la página ya cargó (evento load) y el navegador quedó libre (requestIdleCallback, o
 * 200 ms donde no existe): lo que solo adorna, como el ciclo del logo, se pide después de lo que hace
 * falta para el primer pintado y sin competir con él.
 */
export function useAfterLoad(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let idle = 0;
    let timer = 0;
    const later = () => {
      if (typeof window.requestIdleCallback === 'function') idle = window.requestIdleCallback(() => setReady(true), { timeout: 2000 });
      else timer = window.setTimeout(() => setReady(true), 200);
    };
    if (document.readyState === 'complete') later();
    else window.addEventListener('load', later, { once: true });
    return () => {
      window.removeEventListener('load', later);
      if (idle && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idle);
      window.clearTimeout(timer);
    };
  }, []);
  return ready;
}
