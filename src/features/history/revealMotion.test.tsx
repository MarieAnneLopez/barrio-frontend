import { act, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CountUp } from './CountUp';
import { useScrollReveal } from './useScrollReveal';

// Rendimiento (gran actualización): Historia va en el paquete inicial (H27); sus dos efectos ya no
// traen GSAP: el contador va con requestAnimationFrame y el revelado con IntersectionObserver + WAAPI.
let frames: FrameRequestCallback[] = [];
const step = (ms: number) => act(() => frames.splice(0).forEach((cb) => cb(ms)));
type Entry = { isIntersecting: boolean; target: Element; boundingClientRect: { bottom: number } };
const seen: Array<(entries: Entry[]) => void> = [];

beforeEach(() => {
  frames = [];
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb: (typeof seen)[number]) { seen.push(cb); }
    observe() {} unobserve() {} disconnect() {}
  });
});
afterEach(() => { seen.length = 0; });

describe('CountUp sin GSAP', () => {
  it('sube de 0 al valor en 1,2 s y el lector oye solo el valor final', () => {
    render(<CountUp value={120} format={(n) => String(n)} />);
    step(0);
    expect(screen.getAllByText('0')[0]).toHaveAttribute('aria-hidden', 'true');
    step(600);
    const mid = Number(document.querySelector('[aria-hidden="true"]')?.textContent);
    expect(mid).toBeGreaterThan(60); // power2.out: a mitad de tiempo va en el 75 %
    expect(mid).toBeLessThan(120);
    step(1300);
    expect(document.querySelector('[aria-hidden="true"]')).toHaveTextContent('120');
    expect(document.querySelector('.sr-only')).toHaveTextContent('120');
  });
});

function Revealed({ ready = true, reduced = false }) {
  const root = useRef<HTMLDivElement>(null);
  useScrollReveal(root, ready, reduced);
  return <div ref={root}><p data-reveal><span data-reveal-line />uno</p><p data-reveal><span data-reveal-line />dos</p></div>;
}

const lineOf = (item: HTMLElement) => item.querySelector<HTMLElement>('[data-reveal-line]');

describe('useScrollReveal sin GSAP', () => {
  it('observa el hito visible y revela solo su línea al entrar en pantalla', () => {
    render(<Revealed />);
    const [uno, dos] = [screen.getByText('uno'), screen.getByText('dos')];
    expect(uno.style.opacity).toBe('');
    expect(lineOf(uno)?.style.opacity).toBe('0');
    act(() => seen[0]?.([{ isIntersecting: true, target: uno, boundingClientRect: { bottom: 300 } }]));
    expect(lineOf(uno)?.style.opacity).toBe('');
    act(() => seen[0]?.([{ isIntersecting: false, target: dos, boundingClientRect: { bottom: 900 } }]));
    expect(lineOf(dos)?.style.opacity).toBe('0');
  });

  it('lo que ya quedó arriba de la ventana se muestra sin esperar', () => {
    render(<Revealed />);
    const uno = screen.getByText('uno');
    act(() => seen[0]?.([{ isIntersecting: false, target: uno, boundingClientRect: { bottom: -40 } }]));
    expect(lineOf(uno)?.style.opacity).toBe('');
  });

  it('con movimiento reducido no oculta nada', () => {
    render(<Revealed reduced />);
    expect(lineOf(screen.getByText('uno'))?.style.opacity).toBe('');
  });
});
