import { useEffect, useRef, useState } from 'react';
import { photoSources, type CarouselPhoto } from '../../carouselPhotos';

interface FlightPhotoProps {
  photo: CarouselPhoto;
  alt: string;
  /** Ancho que ocupará en pantalla, para elegir entre el archivo de 640 y el de 1280 px. */
  sizes: string;
  className: string;
}

/** ¿El navegador sabe decodificar una imagen antes de pintarla? (jsdom y los muy antiguos, no) */
const canDecode = (): boolean => typeof HTMLImageElement !== 'undefined' && 'decode' in HTMLImageElement.prototype;

/**
 * Foto del vuelo, servida desde public/assets. No se enseña (data-ready, ver flight.css) hasta que
 * el navegador la tiene decodificada: no aparece a medio cargar ni da un tirón al entrar en escena.
 */
export function FlightPhoto({ photo, alt, sizes, className }: FlightPhotoProps) {
  const image = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(() => !canDecode());
  const { src, srcSet } = photoSources(photo.id);

  useEffect(() => {
    if (!canDecode()) return;
    const show = () => setReady(true);
    // Si falla (archivo dañado, cambio de fuente a media carga) se muestra igual: nunca queda oculta.
    image.current?.decode().then(show, show);
  }, []);

  return (
    <img
      ref={image}
      // `sizes` y `srcSet` van antes que `src`: así el navegador no empieza a bajar el archivo que no toca.
      sizes={sizes}
      srcSet={srcSet}
      src={src}
      width={photo.width}
      height={photo.height}
      alt={alt}
      decoding="async"
      data-ready={ready ? '' : undefined}
      className={className}
    />
  );
}
