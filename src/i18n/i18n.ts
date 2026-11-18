import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { readPref, writePref } from '../lib/storage';
import es from './es.json';

export const SUPPORTED_LANGUAGES = ['es', 'en'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'es';
const LANG_KEY = 'lang';

export function isLanguage(value: unknown): value is Language {
  return SUPPORTED_LANGUAGES.includes(value as Language);
}

/** Idioma guardado (selector ES/EN) o español por defecto. */
export function storedLanguage(): Language {
  const saved = readPref(LANG_KEY);
  return isLanguage(saved) ? saved : DEFAULT_LANGUAGE;
}

// Rendimiento (gran actualización): el español va en el paquete inicial y el inglés baja solo si se
// usa. "content" son traducciones al inglés de textos que llegan de la API en español (hitos de la
// historia); en español se usa el texto de la API tal cual.
void i18n.use(initReactI18next).init({
  resources: { es: { translation: es } },
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: { escapeValue: false },
  initAsync: false,
});

/** Trae las traducciones de un idioma si aún no están (el inglés, en su propio chunk). */
export async function loadLanguage(lng: Language): Promise<void> {
  if (lng !== 'en' || i18n.hasResourceBundle('en', 'translation')) return;
  const [en, content] = await Promise.all([import('./en.json'), import('./content.en.json')]);
  i18n.addResourceBundle('en', 'translation', en.default);
  i18n.addResourceBundle('en', 'content', content.default);
}

// <html lang> sigue al idioma activo (lectores de pantalla, separación silábica).
// Sin DOM (scripts y pruebas en entorno node) no hay <html> que actualizar.
const syncHtmlLang = (lng: string) => {
  if (typeof document !== 'undefined') document.documentElement.lang = lng;
};
syncHtmlLang(i18n.language);
i18n.on('languageChanged', syncHtmlLang);

/** Cambia el idioma (bajando sus textos si hace falta) y lo persiste en localStorage. */
export async function setLanguage(lng: Language): Promise<void> {
  writePref(LANG_KEY, lng);
  await loadLanguage(lng);
  await i18n.changeLanguage(lng);
}

/** El idioma guardado, listo antes de pintar la app: en español no espera nada; sin red, queda en español. */
export const languageReady: Promise<void> = (async () => {
  const lng = storedLanguage();
  if (lng === DEFAULT_LANGUAGE) return;
  try {
    await loadLanguage(lng);
    await i18n.changeLanguage(lng);
  } catch {
    // El archivo del inglés no llegó: la app se pinta en español y el selector puede reintentar.
  }
})();

export default i18n;
