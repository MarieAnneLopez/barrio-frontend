import './flight.css';
import './flight-reduced.css';
import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useToneSection } from '../../../../components/layout/useHeaderLook';
import { useReducedMotion } from '../../../../hooks/useReducedMotion';
import { FlightPhoto } from './FlightPhoto';
import { cardRatio, cardSide } from './flightMath';
import { FLIGHT_PHOTOS } from './flightPhotos';
import { runFlight } from './flightScene';

/** Las N = 9 fotos del vuelo (flightPhotos.ts), en su orden. */
const PHOTOS = FLIGHT_PHOTOS;
/** Fondo estático: la vista desde la terraza hacia el barrio, la más abierta de todas. */
const BACKDROP = PHOTOS[1];

/**
 * Capítulo 2 del Inicio (etapa 3): vuelo entre fotos. La sección mide N + 1 pantallas; mientras se
 * recorre, la cámara avanza con el scroll nativo entre las fotos reales del barrio, que pasan a
 * izquierda y derecha sobre un fondo fijo (flightScene.ts escribe los estilos por referencia).
 * Solo fotografía: sin leyendas. Con movimiento reducido, una rejilla estática de 3 × 3. El header
 * va sólido (no se declara flotante): tras su texto pasarían fotos claras, por debajo de 4,5:1.
 */
export function PhotoFlight() {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  useToneSection(section);

  // Antes del primer pintado: las tarjetas nunca se ven sin colocar.
  useLayoutEffect(() => (section.current && !reduced ? runFlight(section.current) : undefined), [reduced]);

  return (
    <section
      ref={section}
      data-chapter="2"
      data-tone="noche"
      data-reduced={reduced || undefined}
      aria-label={t('home.flight.label')}
      className="flight"
      style={{ '--flight-n': PHOTOS.length } as CSSProperties}
    >
      <div data-flight="sticky" className="flight__sticky">
        {BACKDROP ? <FlightPhoto photo={BACKDROP} alt="" sizes="100vw" className="flight__backdrop" /> : null}
        <div className="flight__camera">
          <div data-flight="space" className="flight__space">
            {PHOTOS.map((photo, i) => (
              <div
                key={photo.id}
                data-flight="card"
                data-side={cardSide(i)}
                className="flight__card"
                style={{ '--flight-ratio': cardRatio(i) } as CSSProperties}
              >
                <FlightPhoto photo={photo} alt={t(`carousel.photos.${photo.id}.alt`)} sizes="90vw" className="flight__photo" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
