import type { TFunction } from 'i18next';
import { moduleFields } from '../../lib/moduleFields';

/** ¿El campo trae un valor que valga la pena mostrar? */
export const hasValue = (value: unknown) => value !== null && value !== undefined && value !== '';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const locale = (lang: string) => (lang === 'en' ? 'en-US' : 'es-CO');

function formatDate(slug: string, field: string, value: string, lang: string): string {
  const spec = moduleFields(slug).fields.find((f) => f.name === field);
  const options: Intl.DateTimeFormatOptions = spec?.format === 'month'
    ? { month: 'long', year: 'numeric', timeZone: 'UTC' }
    : { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' };
  return new Date(`${value}T00:00:00Z`).toLocaleDateString(locale(lang), options);
}

/**
 * Texto visible de un valor. Números y fechas siguen el idioma activo; el
 * resto usa la traducción propia del módulo (values.SLUG.CAMPO.VALOR), luego
 * la general (values.CAMPO.VALOR) y, si no hay ninguna, el valor tal cual.
 */
export function displayValue(t: TFunction, slug: string, field: string, value: unknown, lang: string): string {
  if (typeof value === 'number') return value.toLocaleString(locale(lang));
  const raw = String(value);
  if (ISO_DATE.test(raw)) return formatDate(slug, field, raw, lang);
  return t(`values.${slug}.${field}.${raw}`, {
    defaultValue: t(`values.${field}.${raw}`, { defaultValue: raw }),
  });
}
