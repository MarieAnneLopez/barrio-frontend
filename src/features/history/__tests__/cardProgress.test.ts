import { afterEach, describe, expect, it, vi } from 'vitest';
import { cardTarget, coverTarget, isOnScreen } from '../hinge/cardProgress';
import { stepSpring } from '../hinge/spring';

const VH = 1000;
const card = (top: number, height = 300) => {
  const node = document.createElement('div');
  node.appendChild(document.createElement('a')).href = '#';
  vi.spyOn(node, 'getBoundingClientRect').mockReturnValue({ top, bottom: top + height } as DOMRect);
  document.body.appendChild(node);
  return node;
};

afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('coverTarget', () => {
  it('solo dos estados estables: cubierta abajo, abierta al subir del 85 %', () => {
    expect(coverTarget(1200, VH, 1)).toBe(0);
    expect(coverTarget(960, VH, 1)).toBe(0);
    expect(coverTarget(840, VH, 0)).toBe(1);
    expect(coverTarget(-400, VH, 0)).toBe(1);
  });

  it('entre 85 % y 95 % conserva el estado anterior (sin parpadeo) y se invierte al bajar', () => {
    expect(coverTarget(900, VH, 0)).toBe(0);
    expect(coverTarget(900, VH, 1)).toBe(1);
    expect(coverTarget(960, VH, 1)).toBe(0);
  });

  it('sin alto de ventana, la tarjeta queda abierta', () => {
    expect(coverTarget(500, 0, 0)).toBe(1);
  });
});

describe('cardTarget', () => {
  it('se abre con el foco dentro, aunque esté bajo la franja', () => {
    vi.stubGlobal('innerHeight', VH);
    const node = card(990);
    expect(cardTarget(node, 0)).toBe(0);
    node.querySelector('a')?.focus();
    expect(cardTarget(node, 0)).toBe(1);
  });

  it('isOnScreen distingue la tarjeta visible de la que está fuera', () => {
    vi.stubGlobal('innerHeight', VH);
    expect(isOnScreen(card(400))).toBe(true);
    expect(isOnScreen(card(1100))).toBe(false);
    expect(isOnScreen(card(-500))).toBe(false);
  });
});

describe('stepSpring', () => {
  it('llega al destino sin pasarse, con avance acotado, y se invierte sin saltos', () => {
    let state = { position: 0, velocity: 0 };
    let previous = 0;
    for (let i = 0; i < 120; i++) {
      state = stepSpring(state, 1, 1 / 60, 6, 1.25);
      expect(state.position - previous).toBeLessThanOrEqual(1.25 / 60 + 1e-9);
      expect(state.position).toBeLessThanOrEqual(1);
      previous = state.position;
    }
    expect(state).toEqual({ position: 1, velocity: 0 });
    const back = stepSpring(state, 0, 1 / 60, 6, 1.25);
    expect(back.position).toBeLessThan(1);
    expect(1 - back.position).toBeLessThanOrEqual(1.25 / 60 + 1e-9);
  });
});
