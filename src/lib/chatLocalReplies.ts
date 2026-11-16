// Respuestas locales de Mini Marie (H13). Desde H23 el chat usa /api/v1/chat
// y estas respuestas quedan de respaldo si la API no contesta tras los reintentos (D82).
// Devuelven claves i18n, no textos: así cambian de idioma con la interfaz.
import { categoryPath } from './categoryConfig';

export interface ChatAction {
  /** Ruta interna a la que lleva el botón de acción rápida. */
  to: string;
  /** Clave i18n del nombre del destino. */
  labelKey: string;
}

export interface LocalReply {
  /** Clave i18n del texto (chat.replies.*). */
  key: string;
  params?: Record<string, string>;
  action?: ChatAction;
  /** Tono preventivo (módulo de robos): el avatar pasa a alerta. */
  alert?: boolean;
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
export function localReply(input: string): LocalReply {
  const text = normalize(input);
  if (has(text, ['marie', 'whatsapp', 'contact', 'creadora', 'creator'])) {
    return { key: 'chat.replies.contact', action: { to: '/creadora', labelKey: 'nav.creator' } };
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
