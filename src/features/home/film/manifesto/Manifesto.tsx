import './manifesto.css';
import './manifesto-title.css';
import './manifesto-motion.css';
import { useEffect, useRef, useState } from 'react';
import { refreshTone } from '../../../../components/layout/toneRegistry';
import { useToneSection } from '../../../../components/layout/useHeaderLook';
import { useReducedMotion } from '../../../../hooks/useReducedMotion';
import { ManifestoLayer } from './ManifestoLayer';
import { playManifesto } from './playManifesto';

/** `playing`: noche a la vista · `covered`: el papel ya tapa la sección · `done`: estado final. */
type Phase = 'playing' | 'covered' | 'done';

/**
 * Capítulo 1 del Inicio (etapa 3): manifiesto elástico a pantalla completa. Las 5 palabras del
 * titular entran con rebote mientras el papel se abre en elipse desde abajo a la derecha; se
 * reproduce una vez, al entrar en vista (playManifesto escribe los estilos por referencia). Bajo
 * el header queda noche hasta que el papel cubre la sección. Con movimiento reducido, estado final.
 */
export function Manifesto({ onDone }: { onDone?: () => void }) {
  const reduced = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<Phase>(reduced ? 'done' : 'playing');
  // Pedir movimiento reducido a media animación la da por terminada (ajuste durante el render).
  if (reduced && phase !== 'done') setPhase('done');
  const done = phase === 'done';
  const tone = phase === 'playing' ? 'noche' : 'papel';

  useToneSection(section);
  // El header vuelve a leer el tono cuando cambia (toneRegistry).
  useEffect(() => refreshTone(), [tone]);
  // Terminado (o en estado final desde el principio): el Inicio ya puede pedir lo que sigue (D113).
  useEffect(() => {
    if (done) onDone?.();
  }, [done, onDone]);

  useEffect(() => {
    const node = section.current;
    if (!node || done) return undefined;
    return playManifesto(node, { onCover: () => setPhase('covered'), onEnd: () => setPhase('done') });
  }, [done]);

  return (
    <section ref={section} data-chapter="1" data-tone={tone} data-header-float data-done={done || undefined} className="manifesto">
      {done ? null : <ManifestoLayer tone="noche" decorative />}
      <ManifestoLayer tone="papel" />
    </section>
  );
}
