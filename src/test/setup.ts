import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import i18n from '../i18n/i18n';
import content from '../i18n/content.en.json';
import en from '../i18n/en.json';
import { useAuthStore } from '../store/authStore';
import { useLoadingStore } from '../store/loadingStore';
import { useWelcomeStore } from '../store/welcomeStore';
import { useFocusStore } from '../three/camera/focusStore';
import { ALL_PLACES, usePlaceScope } from '../three/places/placeScope';
import { resetSceneHost } from '../three/sceneHost';
import { useSelectionStore } from '../three/selection/selectionStore';
import { resetTintalData } from '../three/useTintalData';
import { worldPending } from './emptyWorld';

// El inglés baja en su propio chunk (rendimiento); en las pruebas está siempre a mano.
i18n.addResourceBundle('en', 'translation', en);
i18n.addResourceBundle('en', 'content', content);

// Rutas en diferido (H27): con la suite en paralelo un chunk puede tardar más de 1 s en jsdom.
configure({ asyncUtilTimeout: 3000 });
// jsdom no desplaza y avisa en cada window.scrollTo, que ScrollRestoration (AppShell) pide al navegar.
if (typeof window !== 'undefined') window.scrollTo = () => undefined;

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
  // Lo elegido, el foco de la cámara y el alcance de los lugares de la maqueta tampoco pasan de una prueba a otra.
  useSelectionStore.setState({ selected: null, hovered: null });
  useFocusStore.setState({ target: null, tick: 0 });
  usePlaceScope.setState(ALL_PLACES);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
