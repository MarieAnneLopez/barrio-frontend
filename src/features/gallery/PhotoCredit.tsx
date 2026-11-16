import { useTranslation } from 'react-i18next';
import { authorPage, licenseUrl, sourcePage } from '../../lib/photoUrls';

interface PhotoCreditProps {
  author: string | null;
  license: string | null;
  source?: string | null | undefined;
}

// Alto mínimo de 24 px: el destino táctil que pide WCAG 2.2 (antes medían 18 px).
const LINK = 'inline-flex min-h-6 items-center text-fg-secondary underline underline-offset-2';
const external = { target: '_blank', rel: 'noopener noreferrer', className: LINK } as const;

/**
 * Autor (con su perfil en Mapillary), licencia (con su texto legal) y página de origen
 * (Commons o Mapillary), siempre visibles: es la atribución que piden CC BY y CC BY-SA.
 */
export function PhotoCredit({ author, license, source }: PhotoCreditProps) {
  const { t } = useTranslation();
  const legal = licenseUrl(license);
  const page = sourcePage(source);
  const profile = authorPage(source, author);
  return (
    <p className="m-0 flex flex-wrap items-center gap-x-3 font-mono text-[0.75rem] text-fg-secondary">
      {author && profile ? <a href={profile} {...external}>{t('carousel.credit', { author })}</a> : null}
      {author && !profile ? <span>{t('carousel.credit', { author })}</span> : null}
      {license && legal ? <a href={legal} {...external}>{t('carousel.license', { license })}</a> : null}
      {license && !legal ? <span>{t('carousel.license', { license })}</span> : null}
      {page ? (
        <a href={page} {...external}>{t(profile ? 'carousel.sourceMapillary' : 'carousel.source')}</a>
      ) : null}
    </p>
  );
}
