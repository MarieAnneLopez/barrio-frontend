import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import '../i18n/i18n';

// jsdom no tiene WebGL: MapLibre se sustituye por un doble con el mismo contrato.
vi.mock('maplibre-gl', () => import('./maplibreMock'));
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
