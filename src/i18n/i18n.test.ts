import { describe, expect, it } from 'vitest';
import en from './en.json';
import es from './es.json';
import i18n, { DEFAULT_LANGUAGE } from './i18n';

function keysOf(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null
      ? keysOf(value as object, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

describe('i18n', () => {
  it('usa español por defecto', () => {
    expect(DEFAULT_LANGUAGE).toBe('es');
    expect(i18n.language).toBe('es');
  });

  it('es y en tienen las mismas claves', () => {
    expect(keysOf(en).sort()).toEqual(keysOf(es).sort());
  });
});
