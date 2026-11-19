import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SUMMARY } from '../../test/engagementFixtures';
import { mockApi } from '../../test/mockApi';
import { RatingPanel } from './RatingPanel';

// PAL-09 (revisión): una estrella llena y una vacía se separan por un contorno fino (negro frente a
// marrón, unos 1,05 px en las de 14 px de cada reseña). La cifra al lado dice la calificación sin
// depender de él, como en Ranking; va oculta al lector porque ya la dice el nombre de las estrellas.
describe('Calificaciones de un lugar', () => {
  it('la cifra va junto a las estrellas del promedio y de cada reseña', async () => {
    mockApi({ '/barberias/3/calificaciones': { body: SUMMARY } });
    render(<RatingPanel slug="barberias" itemId={3} />);

    const average = await screen.findByRole('img', { name: '4,25 de 5 estrellas' });
    expect(average.parentElement).toHaveTextContent(/^4,25 · 2 calificaciones$/);
    expect(screen.getByText('2 calificaciones')).toBeInTheDocument();
    const review = screen.getByRole('img', { name: '4,5 de 5 estrellas' });
    expect(review.parentElement).toHaveTextContent(/^4,5$/);
    for (const figure of [screen.getByText(/^4,25 ·/), screen.getByText(/^4,5$/)]) {
      expect(figure).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('sin calificaciones no inventa una cifra', async () => {
    mockApi({ '/barberias/3/calificaciones': { body: { promedio: null, total: 0, items: [] } } });
    render(<RatingPanel slug="barberias" itemId={3} />);

    const none = await screen.findByRole('img', { name: 'Sin calificaciones todavía' });
    expect(none.parentElement).toHaveTextContent(/^Sin calificaciones todavía$/);
  });
});
