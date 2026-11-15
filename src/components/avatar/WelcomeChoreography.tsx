import './welcome.css';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useWelcomeStore } from '../../store/welcomeStore';
import { Button } from '../ui/Button';
import { useFocusTrap } from '../ui/useFocusTrap';
import { useLoadingScreenStore } from '../../store/loadingScreenStore';
import { SequenceSprite } from './SequenceSprite';
import { CONFETTI_COUNT, PEEK_SLOTS, welcomeGeometry } from './welcomeGeometry';
import { exitWelcome, playWelcome } from './welcomeTimeline';

const AUTO_CLOSE_MS = 3800;

/**
 * Bienvenida (§11.4.3, D6, D11, H33): Mini Marie grandes se asoman desde los bordes y
 * saludan con sus 7 cuadros; el letrero "Hola" al centro. Espera a la pantalla de carga.
 */
export function WelcomeChoreography() {
  const { t } = useTranslation();
  // Selectores por campo: solo se vuelve a pintar si cambia lo que usa (H29).
  const requested = useWelcomeStore((s) => s.open);
  const loaderUp = useLoadingScreenStore((s) => s.visible);
  const open = requested && !loaderUp;
  const openIfFirstVisit = useWelcomeStore((s) => s.openIfFirstVisit);
  const close = useWelcomeStore((s) => s.close);
  const root = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  const mobile = useMediaQuery('(max-width: 640px)', false);
  const reduced = useReducedMotion();

  useEffect(() => openIfFirstVisit(), [openIfFirstVisit]);

  const requestClose = useCallback(() => {
    const node = root.current;
    if (!node || closing.current) return;
    closing.current = true;
    exitWelcome(node, close);
  }, [close]);
  useFocusTrap(root, open, requestClose);

  useLayoutEffect(() => {
    const node = root.current;
    if (!open || !node) return undefined;
    closing.current = false;
    const timeline = playWelcome(node, welcomeGeometry(window.innerWidth, window.innerHeight), reduced);
    const timer = window.setTimeout(requestClose, AUTO_CLOSE_MS);
    return () => {
      timeline.kill(); // interrupción: nunca se apilan dos coreografías
      window.clearTimeout(timer);
    };
  }, [open, reduced, requestClose]);

  if (!open) return null;
  const sign = t('welcome.sign');

  return createPortal(
    <div ref={root} role="dialog" aria-modal="true" aria-labelledby="welcome-sign" className="fixed inset-0 z-[150] overflow-hidden">
      <div className="welcome-backdrop" onClick={requestClose} aria-hidden="true" />
      {PEEK_SLOTS.filter((slot) => !mobile || slot.mobile).map((slot) => (
        <span key={slot.id} className="welcome-peek" data-edge={slot.edge}>
          <span className="welcome-peek__body" data-edge={slot.edge}>
            <SequenceSprite name="wave" height={mobile ? '36vh' : 'clamp(280px, 64vh, 640px)'} pose={slot.pose} phase={slot.phase} />
          </span>
        </span>
      ))}
      <div aria-hidden="true">
        {Array.from({ length: CONFETTI_COUNT }, (_, i) => <span key={i} className="welcome-confetti" />)}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center pointer-events-none">
        <h2 id="welcome-sign" className="welcome-sign m-0">
          <span className="sr-only">{sign}</span>
          <span aria-hidden="true">
            {[...sign].map((letter, i) => <span key={i} className="welcome-letter">{letter}</span>)}
          </span>
        </h2>
        <p className="sr-only">{t('welcome.avatar')}</p>
        <Button className="welcome-cta pointer-events-auto" onClick={requestClose}>
          {t('welcome.cta')}
        </Button>
      </div>
    </div>,
    document.body,
  );
}
