import { describe, expect, it } from 'vitest';
import { readPref } from '../lib/storage';
import i18n, { loadLanguage, setLanguage } from './i18n';

// Rendimiento (gran actualización): el español va en el paquete inicial y el inglés baja aparte.
describe('carga del inglés bajo demanda', () => {
  it('cargar el inglés deja sus textos y los de "content" disponibles', async () => {
    i18n.removeResourceBundle('en', 'translation');
    i18n.removeResourceBundle('en', 'content');
    expect(i18n.hasResourceBundle('en', 'translation')).toBe(false);
    await loadLanguage('en');
    expect(i18n.hasResourceBundle('en', 'translation')).toBe(true);
    expect(i18n.hasResourceBundle('en', 'content')).toBe(true);
  });

  it('setLanguage baja el inglés antes de cambiar y lo guarda', async () => {
    i18n.removeResourceBundle('en', 'translation');
    await setLanguage('en');
    expect(i18n.language).toBe('en');
    expect(i18n.t('app.title')).not.toBe(i18n.getFixedT('es')('app.title'));
    await setLanguage('es');
    expect(readPref('lang')).toBe('es');
  });
});
