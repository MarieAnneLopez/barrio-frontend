import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChatAvatar } from './ChatAvatar';

const avatar = () => document.querySelector<HTMLElement>('.chat-avatar');
const sprite = () => avatar()?.querySelector<HTMLElement>('.sequence');

describe('Avatar del chat (D86)', () => {
  it.each([44, 48])('en un círculo de %i px lleva a Mini Marie saludando a 80 px, sin escalarla', (size) => {
    render(<ChatAvatar size={size} />);
    expect([avatar()?.style.width, avatar()?.style.height]).toEqual([`${size}px`, `${size}px`]);
    expect(sprite()).toHaveAttribute('data-sequence', 'wave');
    expect([sprite()?.style.width, sprite()?.style.height]).toEqual(['50px', '80px']);
  });

  it('el encuadre va en píxeles enteros: cabeza, hombros y la mano que saluda', () => {
    render(<ChatAvatar size={48} />);
    const frame = sprite()?.parentElement;
    expect(frame?.style.top).toBe('1px');
    expect(frame?.style.left).toBe('-2px'); // (48 − 50) / 2 − 3 % de 50, redondeado
  });

  it('va en un círculo con línea de 1 px, sin borde grueso ni sombra', () => {
    render(<ChatAvatar size={48} />);
    expect(avatar()?.className).toMatch(/(^| )border( |$)/);
    expect(avatar()?.className).not.toMatch(/border-2|shadow/);
  });
});
