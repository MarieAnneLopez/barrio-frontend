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
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
