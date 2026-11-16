import { afterEach, describe, expect, it } from 'vitest';
import { layoutPeeks } from './welcomeGeometry';
import { SLOTS } from './welcomePeeks';

/** La bienvenida mínima: las 8 anclas con su cuerpo, como las pinta WelcomeChoreography. */
function mount(): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = SLOTS.map((slot) => `<span class="welcome-peek" data-slot="${slot}"><span class="welcome-peek__body"></span></span>`).join('');
  document.body.append(root);
  return root;
}
const peek = (root: HTMLElement, slot: string) => root.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
const size = { w: window.innerWidth, h: window.innerHeight };

afterEach(() => {
  document.body.innerHTML = '';
  Object.assign(window, { innerWidth: size.w, innerHeight: size.h });
});

describe('colocación de las 8 Mini Marie (D86)', () => {
  it('ancla cada una en píxeles enteros aunque la pantalla mida un número impar', () => {
    Object.assign(window, { innerWidth: 375, innerHeight: 667 });
    const root = mount();
    layoutPeeks(root);
    expect(peek(root, 'top')?.style.left).toBe('188px'); // 187,5 redondeado
    expect(peek(root, 'left')?.style.top).toBe('334px'); // 333,5 redondeado
  });

  it('marca las que quedan en diagonal: esas sí se suavizan al girar', () => {
    const root = mount();
    layoutPeeks(root);
    const diagonal = SLOTS.filter((slot) => peek(root, slot)?.dataset.diagonal === 'true');
    expect(diagonal).toEqual(['tl', 'tr', 'br', 'bl']);
  });
});
