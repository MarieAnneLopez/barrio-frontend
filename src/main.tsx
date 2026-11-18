import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { languageReady } from './i18n/i18n';
import { wakeBackend } from './lib/wakeBackend';
import './styles/fonts';
import './styles/index.css';

wakeBackend(); // la API gratuita se duerme: el navegador la despierta al abrir la app (D91)
const container = document.getElementById('root');
if (!container) throw new Error('No se encontró el contenedor #root');
const root = container;

// En inglés se espera su archivo de textos (unos milisegundos) para no pintar primero en español.
void languageReady.finally(() =>
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  ),
);
