import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { useA11yStore } from '../../store/a11yStore';
import { SectionIntro } from './SectionIntro';

function renderAt(path: string, title = 'Perfil de la Creadora') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SectionIntro title={title} description="Quién hizo este sitio" eyebrow="Sección" emoji="✨" />
    </MemoryRouter>,
  );
}

afterEach(() => act(() => useA11yStore.setState({ reducedMotion: false })));

describe('entrada de sección (D101)', () => {
  it('lleva un solo h1 con el título real; los fragmentos y la capa de base son decorativos', () => {
    const { container } = renderAt('/creadora');
    expect(screen.getByRole('heading', { level: 1, name: 'Perfil de la Creadora' })).toBeInTheDocument();
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelector('[data-layer="base"]')).toHaveAttribute('aria-hidden', 'true');
    for (const line of container.querySelectorAll('.intro__line')) expect(line).toHaveAttribute('aria-hidden', 'true');
  });

  it('reparte el título en sus líneas y da a cada palabra su turno según la variante de la ruta', () => {
    const { container } = renderAt('/creadora');
    const real = container.querySelector('[data-layer="papel"]');
    expect([...(real?.querySelectorAll('.intro__line') ?? [])].map((line) => line.textContent)).toEqual(['Perfil', 'de la', 'Creadora']);
    const turns = [...(real?.querySelectorAll('[data-word]') ?? [])].map((word) => Number((word as HTMLElement).dataset.word));
    expect([...turns].sort()).toEqual([0, 1, 2, 3]);
  });

  it('cada ruta revela su color y su esquina', () => {
    const { container, unmount } = renderAt('/mapa', 'Mapa 3D');
    const map = container.querySelector('[data-intro]') as HTMLElement;
    expect(map.dataset.reveal).toBe('rosa-claro');
    expect(map.style.getPropertyValue('--intro-at')).toBe('0% 0%');
    unmount();
    const history = renderAt('/historia', 'Historia local').container.querySelector('[data-intro]') as HTMLElement;
    expect(history.dataset.reveal).toBe('rosa');
  });

  it('con movimiento reducido queda en su estado final, sin capa de base', () => {
    act(() => useA11yStore.setState({ reducedMotion: true }));
    const { container } = renderAt('/creadora');
    expect(container.querySelector('[data-intro]')).toHaveAttribute('data-done');
    expect(container.querySelector('[data-layer="base"]')).toBeNull();
  });
});
