import { useTranslation } from 'react-i18next';
import { photoSources, type CarouselPhoto } from './carouselPhotos';

interface Props {
  photo: CarouselPhoto;
  index: number;
  total: number;
  active: boolean;
}

/** Una diapositiva: foto local responsiva + pie con su crédito y licencia. */
export function CarouselSlide({ photo, index, total, active }: Props) {
  const { t } = useTranslation();
  const { src, srcSet } = photoSources(photo.id);
  return (
    <div
      role="group"
      aria-roledescription={t('carousel.slide')}
      aria-label={t('carousel.of', { current: index + 1, total })}
      aria-hidden={!active}
      data-active={active}
      className="carousel-slide absolute inset-0"
    >
      <img
        src={src}
        srcSet={srcSet}
        sizes="(min-width: 1024px) 60vw, 100vw"
        width={photo.width}
        height={photo.height}
        alt={t(`carousel.photos.${photo.id}.alt`)}
        loading={index === 0 ? 'eager' : 'lazy'}
        decoding="async"
        className="carousel-photo h-full w-full object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-[var(--overlay)] px-4 py-3">
        <p className="m-0 text-step-0 font-medium text-fg">{t(`carousel.photos.${photo.id}.caption`)}</p>
        <p className="m-0 flex flex-wrap gap-x-3 font-mono text-[0.75rem] text-fg-secondary">
          <span>{t('carousel.credit', { author: photo.author })}</span>
          {photo.licenseUrl ? (
            <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer" tabIndex={active ? 0 : -1}
              className="text-fg-secondary underline underline-offset-2">
              {t('carousel.license', { license: photo.license })}
            </a>
          ) : (
            <span>{t('carousel.license', { license: photo.license })}</span>
          )}
          <a href={photo.source} target="_blank" rel="noopener noreferrer" tabIndex={active ? 0 : -1}
            className="text-fg-secondary underline underline-offset-2">
            {t('carousel.source')}
          </a>
        </p>
      </div>
    </div>
  );
}
