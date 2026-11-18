import './ribbon.css';
import { memo, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { GalleryLightbox } from '../../modules/GalleryLightbox';
import { RibbonGrid } from './RibbonGrid';
import type { RibbonPhoto } from './ribbonPhotos';
import { useRibbon } from './useRibbon';

interface HitProps {
  index: number;
  label: string;
  active: boolean;
}

/** Botón nativo de una foto: su nombre es la etiqueta real. Roving tabindex: solo la activa entra con Tab. */
const RibbonHit = memo(function RibbonHit({ index, label, active }: HitProps) {
  return (
    <button type="button" data-ribbon-index={index} tabIndex={active ? 0 : -1} className="ribbon-hit">
      <span className="sr-only">{label}</span>
    </button>
  );
});

/**
 * Fotos de la Galería General en una cinta curva en WebGL (three directo). Se recorre arrastrando (con
 * lanzamiento), con la rueda o con las flechas y Home; la foto del centro se abre con clic o Enter en
 * el visor, con autor y licencia, y al cerrarlo el foco vuelve a su botón. El motor se descarga aparte:
 * hasta que llega, y si no hay WebGL, se ve una rejilla accesible con las mismas fotos.
 */
export function PhotoRibbon({ photos }: { photos: readonly RibbonPhoto[] }) {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const [root, frame, host] = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const [open, setOpen] = useState<number | null>(null);
  const viewed = useRef<number | null>(null);
  const ribbon = useRibbon({ root, frame, host, items: photos, reduced, onOpen: setOpen });
  const lightbox = useMemo(() => photos.map((photo) => photo.photo), [photos]);
  const hintId = useId();
  const live = ribbon.mode === 'ribbon';
  const current = photos[ribbon.settled];

  /** El visor pasa a otra foto: la cinta la sigue por detrás. Al cerrarlo se recuerda cuál quedó. */
  const show = (index: number | null) => {
    if (index === null) viewed.current = open;
    else ribbon.center(index);
    setOpen(index);
  };
  // Después de que el visor devuelva el foco a quien lo abrió: si se cerró en otra foto, va al botón de esa.
  useEffect(() => {
    const index = viewed.current;
    if (open !== null || index === null) return;
    viewed.current = null;
    root.current?.querySelector<HTMLElement>(`[data-ribbon-index="${index}"], [data-grid-index="${index}"]`)?.focus({ preventScroll: true });
  }, [open, root]);

  return (
    <div ref={root} className="ribbon" data-mode={ribbon.mode}>
      <div className="ribbon-stage">
        {/* El contenedor del lienzo existe antes que el motor, oculto, para que este tenga dónde montarse. */}
        {ribbon.mode === 'grid' ? null : (
          <div
            ref={frame}
            className="ribbon-frame"
            onKeyDown={ribbon.onKeyDown}
            {...(live ? { role: 'group', 'aria-label': t('galleryRibbon.label'), 'aria-describedby': hintId } : { 'aria-hidden': true })}
          >
            <div ref={host} className="ribbon-canvas" />
            {live ? photos.map((photo, index) => (
              <RibbonHit key={photo.key} index={index} label={photo.label} active={index === ribbon.active} />
            )) : null}
          </div>
        )}
        {live ? null : <RibbonGrid photos={photos} onOpen={setOpen} />}
      </div>
      {live ? (
        <>
          <p id={hintId} className="ribbon-hint">{t(reduced ? 'galleryRibbon.hintReduced' : 'galleryRibbon.hint')}</p>
          <p aria-live="polite" className="sr-only">
            {current ? t('galleryRibbon.current', { n: ribbon.settled + 1, total: photos.length, label: current.label, alt: current.alt }) : ''}
          </p>
        </>
      ) : null}
      <p className="ribbon-credits">
        {t('galleryRibbon.credits')} <Link to="/creditos-fotos">{t('credits.link')}</Link>.
      </p>
      <GalleryLightbox photos={lightbox} index={open} onIndex={show} place={open === null ? '' : (photos[open]?.label ?? '')} />
    </div>
  );
}
