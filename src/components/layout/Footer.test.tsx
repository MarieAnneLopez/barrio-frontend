import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { FAQ_KEYS } from '../../features/faq/faqKeys';
import en from '../../i18n/en.json';
import es from '../../i18n/es.json';
import { renderRoute, setViewport } from '../../test/renderRoute';

const SPEC_WHATSAPP =
  'https://wa.me/573132596937?text=Hola%20Marie%2C%20estoy%20visitando%20la%20plataforma%20de%20reconocimiento%20del%20barrio%20El%20Tintal.';

beforeEach(() => {
  window.localStorage.clear();
  setViewport(true);
});

const FAQ_TITLE = es.faq.items.q1.q;
const footer = () => screen.getByRole('contentinfo', { name: 'Pie de página' });

describe('Footer', () => {
  it('enlaza los 14 módulos y muestra la ubicación', () => {
    renderRoute('/');
    const modules = within(footer()).getByRole('navigation', { name: 'Módulos del barrio' });
    expect(within(modules).getAllByRole('link')).toHaveLength(14);
    expect(within(footer()).getByText('Localidad de Kennedy')).toBeInTheDocument();
  });

  it('incluye el Perfil de la Creadora con su contacto', () => {
    renderRoute('/');
    const card = within(footer()).getByRole('region', { name: 'Marie Anne Lopez Poveda' });
    expect(card).toHaveTextContent('estudiante de Ingeniería Catastral y Geodesia');
    expect(card).toHaveTextContent('Funza');
    // D88: a escala entera, como las demás (64 × 140 px; el recurso doble o cuádruple según la pantalla).
    const sprite = within(card).getByRole('img', { name: /Mini Marie/ }).querySelector<HTMLElement>('.sequence[data-sequence="idle"]');
    expect([sprite?.style.width, sprite?.style.height]).toEqual(['64px', '140px']);
    expect([...(sprite?.querySelectorAll('source') ?? [])].map((s) => s.getAttribute('srcset'))).toEqual([
      '/assets/avatar/idle/idle_560.webp', '/assets/avatar/idle/idle_280.webp',
    ]);
    expect(sprite).toHaveAttribute('data-playing'); // sprites32: respira en un ciclo de 32 cuadros
    // Al pie de cada página: su atlas (122 KB a 1×) se baja solo cuando el pie se acerca.
    expect(sprite?.querySelector('img')).toHaveAttribute('loading', 'lazy');
    expect(within(card).getByRole('link', { name: /WhatsApp/ })).toHaveAttribute('href', SPEC_WHATSAPP);
  });

  it('tiene al menos 8 preguntas frecuentes en ES y EN', () => {
    expect(FAQ_KEYS.length).toBeGreaterThanOrEqual(8);
    for (const key of FAQ_KEYS) {
      expect(es.faq.items[key].q.length).toBeGreaterThan(5);
      expect(en.faq.items[key].a.length).toBeGreaterThan(5);
    }
  });

  it('no duplica bloques en /preguntas ni en /creadora', async () => {
    const { unmount } = renderRoute('/preguntas');
    expect(await screen.findAllByRole('button', { name: FAQ_TITLE })).toHaveLength(1);
    unmount();
    renderRoute('/creadora');
    expect(await screen.findAllByRole('heading', { name: 'Marie Anne Lopez Poveda' })).toHaveLength(1);
  });

  // PAL-08 (D100, DISENO-V3 §2): el pie es una franja rosa claro con texto negro y una banda marrón con
  // el nombre en crema grande (la medida, en styles/largeText.test). Sin otra banda, en todo ancho.
  it('franja rosa claro en todo ancho con módulos, ubicación, derechos, nota académica y créditos; sin barra amarilla', () => {
    renderRoute('/');
    const modules = within(footer()).getByRole('navigation', { name: 'Módulos del barrio' });
    const strip = modules.closest<HTMLElement>('.tone-papel') as HTMLElement;
    expect(strip).toHaveClass('bg-pink');
    expect(strip.className).not.toMatch(/\b\w+:bg-/); // el rosa claro no espera a 768 px
    for (const text of [es.footer.rights, es.footer.academic]) expect(within(strip).getByText(text)).toBeInTheDocument();
    expect(within(strip).getByRole('link', { name: es.credits.link })).toHaveClass('text-fg');
    expect(footer().querySelector('[class*="bg-mark"]')).toBeNull();
    expect(within(footer()).getByText(es.app.title).closest('.bg-band')).not.toBeNull();
  });
});

describe('WhatsAppFloat', () => {
  it('abre wa.me con el mensaje de la especificación en otra pestaña', () => {
    renderRoute('/');
    const link = screen.getByRole('link', { name: /Escribir a Marie por WhatsApp/ });
    expect(link).toHaveAttribute('href', SPEC_WHATSAPP);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
