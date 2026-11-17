import { defineConfig } from '@playwright/test';

// E2E (H31): recorre el build de producción (vite preview) contra la API local en el
// puerto 8000, que debe estar encendida (README). Edge del sistema por defecto;
// E2E_CHANNEL=chrome o vacío para otro navegador.
const PORT = 4174;

// Recursos (D95): un solo navegador headless y un solo proceso de pruebas; el servidor lo levanta
// Playwright y lo cierra al terminar (nunca reutiliza uno viejo que sirva otro build).
export default defineConfig({
  testDir: 'e2e',
  timeout: 300_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  globalTeardown: './e2e/globalTeardown.ts',
  use: {
    headless: true,
    baseURL: `http://localhost:${PORT}`,
    channel: process.env.E2E_CHANNEL ?? 'msedge',
    viewport: { width: 1440, height: 900 },
  },
  // G (H37): español e inglés, escritorio (1440) y celular (390). La interfaz elegante (D84) se
  // diseña a 390, 768 y 1440: el ancho de tableta entra en español.
  projects: [
    { name: 'es-1440', metadata: { lang: 'es' }, use: { viewport: { width: 1440, height: 900 } } },
    { name: 'en-1440', metadata: { lang: 'en' }, use: { viewport: { width: 1440, height: 900 } } },
    { name: 'es-768', metadata: { lang: 'es' }, use: { viewport: { width: 768, height: 1024 }, hasTouch: true } },
    { name: 'es-390', metadata: { lang: 'es' }, use: { viewport: { width: 390, height: 844 }, hasTouch: true } },
    { name: 'en-390', metadata: { lang: 'en' }, use: { viewport: { width: 390, height: 844 }, hasTouch: true } },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
