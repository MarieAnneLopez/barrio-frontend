// Despertador de la API (D91). Render gratuito se apaga tras 15 min sin uso y tarda ~55 s en
// volver. Las peticiones que pasan por el proxy de Pages no lo despiertan (medido tres veces el
// 2026-11-16: 502 inmediatos durante minutos), pero una petición directa sí. Por eso, al abrir la
// app, el navegador pide /api/_wake y el proxy lo redirige a la API: esa segunda petición ya es
// directa. Va sin credenciales y sin leer la respuesta: solo sirve para que el servidor arranque.
import { WAKE_PATH } from './pagesProxy';

export { WAKE_PATH };

const LOCAL = new Set(['localhost', '127.0.0.1', '[::1]']);

export function wakeBackend(hostname: string = window.location.hostname): void {
  if (LOCAL.has(hostname) || typeof fetch !== 'function') return; // la API local no se duerme
  fetch(WAKE_PATH, { mode: 'no-cors', credentials: 'omit', cache: 'no-store' }).catch(() => undefined);
}
