// Reproduce una vez el manifiesto elástico (capítulo 1): un solo rAF que escribe estilos por
// referencia, sin un setState por cuadro. Se detiene fuera de pantalla, con la pestaña oculta y
// mientras algo a pantalla completa tapa la página; al volver sigue donde iba.
import { useLoadingScreenStore } from '../../../../store/loadingScreenStore';
import { useWelcomeStore } from '../../../../store/welcomeStore';
import { playDuration, revealClip, revealCovers, revealProgress, wordFrame } from './manifestoMath';

/** Un cuadro que llega tarde avanza como mucho esto (s): un tirón de carga no se come la animación. */
const MAX_STEP = 0.05;

export interface PlayHandlers {
  /** El papel ya cubre toda la sección: lo que queda bajo el header es papel. */
  onCover: () => void;
  /** Terminó: las palabras están en su sitio y el papel, abierto del todo. */
  onEnd: () => void;
}

/** La pantalla de carga y la bienvenida tapan toda la página: nadie vería la animación. */
const overlayUp = (): boolean => useLoadingScreenStore.getState().visible || useWelcomeStore.getState().open;

/**
 * Anima las palabras (`[data-word="i"]`, en las dos capas) y el recorte de la capa papel
 * (`[data-layer="papel"]`) de `section` cuando entra en vista. Devuelve la limpieza.
 */
export function playManifesto(section: HTMLElement, { onCover, onEnd }: PlayHandlers): () => void {
  const words = [...section.querySelectorAll<HTMLElement>('[data-word]')].map((node) => ({ node, index: Number(node.dataset.word) }));
  const paper = section.querySelector<HTMLElement>('[data-layer="papel"]');
  const end = playDuration(Math.max(0, ...words.map((word) => word.index)) + 1);
  let elapsed = 0;
  let last = 0; // marca del cuadro anterior; 0 al arrancar o reanudar, para no sumar el tiempo en pausa
  let frame = 0;
  let inView = typeof IntersectionObserver === 'undefined';
  let papered = false;
  let finished = false;

  const draw = () => {
    for (const { node, index } of words) {
      const { transform, opacity } = wordFrame(elapsed, index);
      node.style.transform = transform;
      node.style.opacity = opacity;
    }
    const b = revealProgress(elapsed);
    if (paper) paper.style.clipPath = revealClip(b);
    if (papered || !revealCovers(b)) return;
    papered = true;
    onCover();
  };

  const tick = (now: number) => {
    frame = 0;
    if (last) elapsed += Math.min(MAX_STEP, (now - last) / 1000);
    last = now;
    draw();
    if (elapsed < end) frame = requestAnimationFrame(tick);
    else {
      finished = true;
      onEnd();
    }
  };

  /** Pide o suelta el cuadro pendiente según se pueda ver la animación. */
  const sync = () => {
    const run = !finished && inView && !document.hidden && !overlayUp();
    if (run && !frame) {
      last = 0;
      frame = requestAnimationFrame(tick);
    } else if (!run && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  };

  const observer = typeof IntersectionObserver === 'undefined' ? undefined : new IntersectionObserver((entries) => {
    inView = entries.at(-1)?.isIntersecting ?? inView;
    sync();
  });
  observer?.observe(section);
  document.addEventListener('visibilitychange', sync);
  const unwatch = [useLoadingScreenStore.subscribe(sync), useWelcomeStore.subscribe(sync)];
  sync();

  return () => {
    finished = true;
    sync();
    observer?.disconnect();
    document.removeEventListener('visibilitychange', sync);
    unwatch.forEach((off) => off());
    for (const { node } of words) node.style.transform = node.style.opacity = '';
    if (paper) paper.style.clipPath = '';
  };
}
