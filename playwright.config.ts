import { defineConfig } from '@playwright/test';

// E2E (H31): recorre el build de producción (vite preview) contra la API local en el
// puerto 8000, que debe estar encendida (README). Edge del sistema por defecto;
// E2E_CHANNEL=chrome o vacío para otro navegador.
const PORT = 4174;

export default defineConfig({
  testDir: 'e2e',
  timeout: 300_000,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: process.env.E2E_CHANNEL ?? 'msedge',
    viewport: { width: 1440, height: 900 },
  },
  // G (H37): español e inglés, escritorio (1440) y celular (390).
  projects: [
    { name: 'es-1440', metadata: { lang: 'es' }, use: { viewport: { width: 1440, height: 900 } } },
    { name: 'en-1440', metadata: { lang: 'en' }, use: { viewport: { width: 1440, height: 900 } } },
    { name: 'es-390', metadata: { lang: 'es' }, use: { viewport: { width: 390, height: 844 }, hasTouch: true } },
    { name: 'en-390', metadata: { lang: 'en' }, use: { viewport: { width: 390, height: 844 }, hasTouch: true } },
  ],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
