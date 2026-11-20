// Respuestas locales de Mini Marie (H13). Desde H23 el chat usa /api/v1/chat
// y estas respuestas quedan disponibles mientras se consulta la API o si no contesta.
// Devuelven claves i18n, no textos: así cambian de idioma con la interfaz.
import { categoryPath } from './categoryConfig';

export interface ChatAction {
  /** Ruta interna a la que lleva el botón de acción rápida. */
  to: string;
  /** Clave i18n del nombre del destino. */
  labelKey: string;
}

export interface LocalReply {
  limited?: boolean;
  /** Clave i18n del texto (chat.replies.*). */
  key: string;
  params?: Record<string, string>;
  action?: ChatAction;
  /** Tono preventivo (módulo de robos): el avatar pasa a alerta. */
  alert?: boolean;
  sources?: { titulo: string; url: string; consultado_en: string }[];
}

/** Raíces (ES/EN, sin tildes) de cada módulo; casan al inicio de una palabra. */
const CATEGORY_WORDS: Record<string, readonly string[]> = {
  'centros-educativos': ['colegio', 'escuela', 'jardin', 'universidad', 'educa', 'school'],
  'escenarios-deportivos': ['cancha', 'deporte', 'deportivo', 'sport', 'futbol'],
  'camaras-seguridad': ['camara', 'camera', 'vigilancia'],
  'zonas-verdes': ['parque', 'zona verde', 'park', 'arbol', 'green'],
  'datos-catastrales': ['catastr', 'predio', 'estrato', 'avaluo', 'cadastr'],
  'estado-calles': ['calle', 'vias?(?![a-z])', 'street', 'road', 'hueco'],
  'estaciones-transporte': ['transmilenio', 'estacion', 'bus(es)?(?![a-z])', 'transporte', 'transport', 'station'],
  'sitios-comida': ['comida', 'restaurante', 'comer', 'food', 'restaurant', 'eat(?![a-z])'],
  librerias: ['libreria', 'libro', 'book', 'papeleria'],
  robos: ['robo', 'hurto', 'inseguridad', 'theft', 'robbery', 'crime'],
  localidad: ['kennedy', 'localidad', 'district', 'alcaldia'],
  'atencion-inmediata': ['hospital', 'cami(?![a-z])', 'urgencia', 'salud', 'clinic', 'health', 'emergenc'],
  veterinarias: ['veterinari', 'mascota', 'perro', 'gato', 'vets?(?![a-z])', 'pets?(?![a-z])'],
  barberias: ['barber', 'peluquer', 'corte', 'haircut'],
};

const has = (text: string, words: readonly string[]) =>
  new RegExp(`(^|[^a-z])(?:${words.join('|')})`).test(text);

/** Minúsculas y sin tildes, para comparar sin depender de cómo se escriba. */
export function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

/** Elige la respuesta local para un mensaje del usuario. */
export function localReply(input: string, previousPlace = ''): LocalReply {
  const text = normalize(input);
  if (/\b(me estan robando|me estan atacando|hay un incendio|necesito una ambulancia|i am being robbed|i need an ambulance|there is a fire)\b/.test(text)) {
    return { key: 'chat.replies.urgent', alert: true };
  }
  const followup = /^(?:[¿?¡!\s]|y |and |a que |what |when |is it |does it |que |el |su )*(?:hora|abre|cierr|telefono|contact|phone|hours|open|close)/.test(text);
  const station = has(text, ['estacion', 'station', 'transmilenio', 'portal americas']);
  if (!station && (has(text, ['biblioteca', 'library', 'libraries']) || (followup && /biblioteca|library/i.test(previousPlace) && !/estación|station/i.test(previousPlace)))) {
    const key = has(text, ['telefon', 'phone', 'contact']) ? 'chat.replies.libraryPhone'
      : has(text, ['hora', 'abre', 'cierr', 'open', 'hours', 'close']) ? 'chat.replies.libraryHours' : 'chat.replies.library';
    return { key, action: { to: '/historia', labelKey: 'nav.history' },
      sources: [{ titulo: 'BibloRed', url: 'https://biblored.gov.co/bibliotecas/biblioteca-tintal',
        consultado_en: '2026-11-20' }] };
  }
  if (station || has(text, ['transporte', 'transport']) || (followup && /estación|station|portal/i.test(previousPlace))) {
    return { key: 'chat.replies.transit', action: { to: categoryPath('estaciones-transporte'),
      labelKey: 'categories.estaciones-transporte.name' },
      sources: [{ titulo: 'TransMilenio', url: 'https://www.transmilenio.gov.co/comunicaciones/noticias-de-transmilenio/especiales-transmilenio/transmiapp-aplicacion-oficial-transmilenio',
        consultado_en: '2026-11-20' }] };
  }
  for (const [slug, words] of Object.entries(CATEGORY_WORDS)) {
    if (has(text, words)) {
      return {
        key: slug === 'robos' ? 'chat.replies.theft' : 'chat.replies.category',
        params: { slug },
        action: { to: categoryPath(slug), labelKey: `categories.${slug}.name` },
        alert: slug === 'robos',
      };
    }
  }
  if (has(text, ['marie', 'whatsapp', 'contact', 'creadora', 'creator'])) {
    return { key: 'chat.replies.contact', action: { to: '/creadora', labelKey: 'nav.creator' } };
  }
  if (has(text, ['mapa', 'map', 'cerca', 'near', '3d'])) {
    return { key: 'chat.replies.map', action: { to: '/mapa', labelKey: 'nav.map' } };
  }
  if (has(text, ['historia', 'history', 'hacienda', 'origen'])) {
    return { key: 'chat.replies.history', action: { to: '/historia', labelKey: 'nav.history' } };
  }
  if (has(text, ['ayuda', 'help', 'puedes', 'can you', 'como funciona'])) {
    return { key: 'chat.replies.help' };
  }
  if (/\b(hola|buenas|hello|hi|hey|saludos)\b/.test(text)) {
    return { key: 'chat.replies.greet' };
  }
  return { key: 'chat.replies.fallback' };
}
