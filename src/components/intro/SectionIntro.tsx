import './section-intro.css';
import './section-intro-motion.css';
import './section-intro-wide.css';
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { playManifesto } from '../../features/home/film/manifesto/playManifesto';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { IntroLayer, type IntroContent, type IntroWord } from './IntroLayer';
import { cornerAt, cornerClip, fitSize, splitLines, staggerOrder, type WordOrder } from './introMath';
import { introVariant } from './introVariant';

/** Reparte el título en líneas y numera el turno de cada palabra según el orden de la variante. */
function layout(title: string, order: WordOrder, indents: readonly number[]) {
  const split = splitLines(title.split(/\s+/).filter(Boolean));
  const starts = staggerOrder(order, split.flat().length);
  let next = 0;
  const lines: IntroWord[][] = split.map((line) => line.map((text) => ({ text, start: starts[next++] ?? 0 })));
  return { lines, size: fitSize(split, indents) };
}

/**
 * Entrada de cada sección (D101): el manifiesto del Inicio con el título de la página. Misma E(raw),
 * escalonado, máscaras y elipse del revelado (playManifesto); por ruta cambian la esquina del
 * revelado, el orden de las palabras, el desfase de las líneas y el color revelado. Se reproduce
 * una vez por entrada (PageHeader la monta con la ruta de clave), dura menos de 1,5 s y no tapa el
 * contenido. FAQ, Ayuda, Acceso y Créditos dejan el título visible desde el inicio, igual que
 * con movimiento reducido.
 */
export function SectionIntro(content: IntroContent) {
  const { pathname } = useLocation();
  const reduced = useReducedMotion();
  const node = useRef<HTMLElement>(null);
  const quiet = ['/preguntas-frecuentes', '/faq', '/ayuda', '/acceso', '/creditos-fotos'].includes(pathname);
  const [done, setDone] = useState(reduced || quiet);
  // Pedir movimiento reducido a media animación la da por terminada (ajuste durante el render).
  if (reduced && !done) setDone(true);
  const variant = introVariant(pathname);
  const { lines, size } = useMemo(
    () => layout(content.title, variant.order, variant.indents),
    [content.title, variant.order, variant.indents],
  );

  useEffect(() => {
    const element = node.current;
    if (!element || done) return undefined;
    return playManifesto(element, { onCover: () => undefined, onEnd: () => setDone(true), clip: cornerClip(variant.corner) });
  }, [done, variant.corner]);

  const style = { '--fit': size, '--lines': lines.length, '--intro-at': cornerAt(variant.corner) } as CSSProperties;
  return (
    <header ref={node} data-intro data-reveal={variant.reveal} data-reveal-wide={variant.revealWide} data-done={done || undefined} className="intro" style={style}>
      {done ? null : <IntroLayer layer="base" lines={lines} indents={variant.indents} {...content} />}
      <IntroLayer layer="papel" lines={lines} indents={variant.indents} {...content} />
    </header>
  );
}
