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

  it('mide también la ventana del atlas: la mano que saluda sale 16 px por la derecha de la caja', () => {
    Object.assign(window, { innerWidth: 1440, innerHeight: 900 });
    const root = mount();
    const measure = (el: Element | null, w: number) => Object.defineProperties(el, { offsetWidth: { value: w }, offsetHeight: { value: 160 } });
    const body = root.querySelector('[data-slot="tl"] .welcome-peek__body');
    measure(body, 82);
    body?.insertAdjacentHTML('beforeend', '<span class="sequence__window"></span>');
    measure(body?.querySelector('.sequence__window') ?? null, 98);
    // El chat, a 10 px de la caja de la de abajo (fuera del margen de 8 px), pero al alcance de su mano.
    const chat = Object.assign(document.createElement('button'), { className: 'chat-launcher' });
    chat.getBoundingClientRect = () => ({ left: 771, right: 791, top: 880, bottom: 900, width: 20, height: 20 }) as DOMRect;
    document.body.append(chat);
    layoutPeeks(root);
    expect(peek(root, 'bottom')?.dataset.shifted).not.toBe('0');
  });
});
