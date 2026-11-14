import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import i18n from '../i18n/i18n';
import { App } from './App';

describe('App', () => {
  afterEach(async () => {
    await act(() => i18n.changeLanguage('es'));
  });

  it('muestra el título en español por defecto', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Reconoce tu Barrio: El Tintal' }),
    ).toBeInTheDocument();
  });

  it('cambia a inglés con i18next', async () => {
    render(<App />);
    await act(() => i18n.changeLanguage('en'));
    expect(
      screen.getByRole('heading', { level: 1, name: /Get to Know Your Neighborhood/ }),
    ).toBeInTheDocument();
  });
});
