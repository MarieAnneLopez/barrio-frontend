import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import i18n from '../i18n/i18n';
import content from '../i18n/content.en.json';
import en from '../i18n/en.json';
import { chatRetry } from '../lib/chatApi';
import { useAuthStore } from '../store/authStore';
import { useLoadingStore } from '../store/loadingStore';
import { useWelcomeStore } from '../store/welcomeStore';
import { resetSceneHost } from '../three/sceneHost';
import { resetTintalData } from '../three/useTintalData';
import { worldPending } from './emptyWorld';

// El inglés baja en su propio chunk (rendimiento); en las pruebas está siempre a mano.
i18n.addResourceBundle('en', 'translation', en);
i18n.addResourceBundle('en', 'content', content);

// Rutas en diferido (H27): con la suite en paralelo un chunk puede tardar más de 1 s en jsdom.
configure({ asyncUtilTimeout: 3000 });
// Los reintentos del chat (D82) se prueban sin esperas reales.
chatRetry.delaysMs = [0, 0];

// La bienvenida se abre en la primera visita de la sesión: en las pruebas del
// resto de la app se da por vista; sus propias pruebas la vuelven a habilitar.
// Las pruebas de scripts/ corren en entorno node, sin window.
beforeEach(() => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem('mini-marie:welcome-seen', 'true');
  useWelcomeStore.setState({ open: false });
  useAuthStore.setState({ status: 'checking', user: null, dialogOpen: false });
  useLoadingStore.setState({ tasks: {} });
  // La maqueta 3D y sus datos son compartidos por toda la app (D83): cada prueba empieza de cero.
  resetTintalData();
  worldPending();
  resetSceneHost();
});

// jsdom no tiene WebGL: MapLibre se sustituye por un doble con el mismo contrato.
vi.mock('maplibre-gl', () => import('./maplibreMock'));
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
