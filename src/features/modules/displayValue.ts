import type { TFunction } from 'i18next';

/** ¿El campo trae un valor que valga la pena mostrar? */
export const hasValue = (value: unknown) => value !== null && value !== undefined && value !== '';

/**
 * Texto visible de un valor. Orden: la traducción propia del módulo
 * (values.SLUG.CAMPO.VALOR), luego la general (values.CAMPO.VALOR) y, si no
 * hay ninguna, el valor tal cual. Los números siguen el idioma activo.
 */
export function displayValue(t: TFunction, slug: string, field: string, value: unknown, lang: string): string {
  if (typeof value === 'number') return value.toLocaleString(lang === 'en' ? 'en-US' : 'es-CO');
  const raw = String(value);
  return t(`values.${slug}.${field}.${raw}`, {
    defaultValue: t(`values.${field}.${raw}`, { defaultValue: raw }),
  });
}
