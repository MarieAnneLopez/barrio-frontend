import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import '../i18n/i18n';
import { useWelcomeStore } from '../store/welcomeStore';

// La bienvenida se abre en la primera visita de la sesión: en las pruebas del
// resto de la app se da por vista; sus propias pruebas la vuelven a habilitar.
// Las pruebas de scripts/ corren en entorno node, sin window.
beforeEach(() => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem('mini-marie:welcome-seen', 'true');
  useWelcomeStore.setState({ open: false });
});

// jsdom no tiene WebGL: MapLibre se sustituye por un doble con el mismo contrato.
vi.mock('maplibre-gl', () => import('./maplibreMock'));
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
