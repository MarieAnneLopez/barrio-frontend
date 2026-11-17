import { createConnection } from 'node:net';

// Recursos (D95): al terminar, Playwright ya cerró páginas, contextos y el navegador, y apaga el
// servidor que levantó. Aquí se comprueba que el puerto de la vista previa quedó libre: si no, se
// avisa para no dejar un servidor huérfano ocupando memoria.
const PORT = 4174;

function inUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: '127.0.0.1' });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
  });
}

export default async function globalTeardown(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (await inUse(PORT)) console.warn(`[recursos] el puerto ${PORT} sigue ocupado tras las pruebas: ciérralo.`);
}
