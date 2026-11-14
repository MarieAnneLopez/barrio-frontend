import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { readPref, writePref } from '../lib/storage';
import en from './en.json';
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

void i18n.use(initReactI18next).init({
  resources: { es: { translation: es }, en: { translation: en } },
  lng: storedLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: { escapeValue: false },
  initAsync: false,
});

// <html lang> sigue al idioma activo (lectores de pantalla, separación silábica).
// Sin DOM (scripts y pruebas en entorno node) no hay <html> que actualizar.
const syncHtmlLang = (lng: string) => {
  if (typeof document !== 'undefined') document.documentElement.lang = lng;
};
syncHtmlLang(i18n.language);
i18n.on('languageChanged', syncHtmlLang);

/** Cambia el idioma y lo persiste en localStorage. */
export async function setLanguage(lng: Language): Promise<void> {
  writePref(LANG_KEY, lng);
  await i18n.changeLanguage(lng);
}

export default i18n;
