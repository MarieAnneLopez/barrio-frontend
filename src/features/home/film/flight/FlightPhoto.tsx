import { useEffect, useRef, useState } from 'react';
import { photoSources, type CarouselPhoto, type PhotoFolder } from '../../carouselPhotos';

interface FlightPhotoProps {
  photo: CarouselPhoto & { folder?: PhotoFolder };
  alt: string;
  /** Ancho que ocupará en pantalla, para elegir entre el archivo de 640 y el de 1280 px. */
  sizes: string;
  className: string;
  /** false: aún no se pide (D113); su caja ya ocupa su sitio. */
  load?: boolean;
  /** Avisa cuando la foto está pedida y decodificada (o falló): suelta la siguiente. */
  onReady?: (() => void) | undefined;
}

/** ¿El navegador sabe decodificar una imagen antes de pintarla? (jsdom y los muy antiguos, no) */
const canDecode = (): boolean => typeof HTMLImageElement !== 'undefined' && 'decode' in HTMLImageElement.prototype;

/**
 * Foto del vuelo, servida desde public/assets. No se enseña (data-ready, ver flight.css) hasta que
 * el navegador la tiene decodificada: no aparece a medio cargar ni da un tirón al entrar en escena.
 */
export function FlightPhoto({ photo, alt, sizes, className, load = true, onReady }: FlightPhotoProps) {
  const image = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(() => !canDecode());
  const { src, srcSet } = photoSources(photo.id, photo.folder);

  useEffect(() => {
    if (!load || !canDecode()) return;
    const show = () => setReady(true);
    // Si falla (archivo dañado, cambio de fuente a media carga) se muestra igual: nunca queda oculta.
    image.current?.decode().then(show, show);
  }, [load]);

  useEffect(() => {
    if (load && ready) onReady?.();
  }, [load, ready, onReady]);

  return (
    <img
      ref={image}
      // `sizes` y `srcSet` van antes que `src`: así el navegador no empieza a bajar el archivo que no toca.
      sizes={sizes}
      srcSet={load ? srcSet : undefined}
      src={load ? src : undefined}
      width={photo.width}
      height={photo.height}
      alt={alt}
      decoding="async"
      // El vuelo va bajo el manifiesto (100svh): sus 10 imágenes no compiten con la primera pantalla.
      loading="lazy"
      data-ready={load && ready ? '' : undefined}
      className={className}
    />
  );
}
