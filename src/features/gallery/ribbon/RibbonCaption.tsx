import './ribbon-caption.css';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../../../lib/categoryConfig';
import { PhotoCredit } from '../PhotoCredit';
import type { RibbonPhoto } from './ribbonPhotos';

/**
 * Atribución de una foto (autor, licencia y fuente: lo que piden CC BY y CC BY-SA) y, si es de un
 * lugar, el enlace a su módulo, como lo tenía cada lugar en la galería de antes de la cinta.
 */
export function PhotoMeta({ photo }: { photo: RibbonPhoto }) {
  const { t } = useTranslation();
  const emoji = CATEGORIES.find((category) => category.slug === photo.module)?.emoji;
  return (
    <>
      <PhotoCredit author={photo.photo.autor} license={photo.photo.licencia} source={photo.photo.source_ref} />
      {photo.module ? (
        <Link to={`/categorias/${photo.module}`} className="ribbon-module">
          {emoji ? <span aria-hidden="true">{emoji} </span> : null}
          {t('galleryPage.module', { module: t(`categories.${photo.module}.name`) })}
        </Link>
      ) : null}
    </>
  );
}

/** Pie de la foto centrada, siempre a la vista bajo la cinta: su texto y su atribución. */
export function RibbonCaption({ photo }: { photo: RibbonPhoto | undefined }) {
  if (!photo) return null;
  return (
    <div className="ribbon-caption">
      <p className="ribbon-caption__text">{photo.alt}</p>
      <PhotoMeta photo={photo} />
    </div>
  );
}
