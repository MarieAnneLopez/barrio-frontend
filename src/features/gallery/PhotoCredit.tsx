import { useTranslation } from 'react-i18next';
import { authorPage, licenseUrl, sourcePage } from '../../lib/photoUrls';

interface PhotoCreditProps {
  author: string | null;
  license: string | null;
  source?: string | null | undefined;
  /** Licencia en etiqueta amarilla y fuente en insignia rosa (D100), con texto negro. */
  badges?: boolean;
}

// Alto mínimo de 24 px: el destino táctil que pide WCAG 2.2 (antes medían 18 px).
const LINK = 'inline-flex min-h-6 items-center text-fg-secondary underline underline-offset-2';
const BADGE = 'rounded-sm px-2 text-on-mark no-underline hover:underline';
const linkProps = (extra: string) =>
  ({ target: '_blank', rel: 'noopener noreferrer', className: extra ? `${LINK} ${BADGE} ${extra}` : LINK }) as const;

/**
 * Autor (con su perfil en Mapillary), licencia (con su texto legal) y página de origen
 * (Commons o Mapillary), siempre visibles: es la atribución que piden CC BY y CC BY-SA.
 */
export function PhotoCredit({ author, license, source, badges = false }: PhotoCreditProps) {
  const { t } = useTranslation();
  const legal = licenseUrl(license);
  const page = sourcePage(source);
  const profile = authorPage(source, author);
  const external = linkProps('');
  const licenseLink = linkProps(badges ? 'bg-mark' : '');
  const sourceLink = linkProps(badges ? 'bg-strong' : '');
  return (
    <p className="m-0 flex flex-wrap items-center gap-x-3 font-mono text-step--1 text-fg-secondary">
      {author && profile ? <a href={profile} {...external}>{t('carousel.credit', { author })}</a> : null}
      {author && !profile ? <span>{t('carousel.credit', { author })}</span> : null}
      {license && legal ? <a href={legal} {...licenseLink}>{t('carousel.license', { license })}</a> : null}
      {license && !legal ? <span>{t('carousel.license', { license })}</span> : null}
      {page ? (
        <a href={page} {...sourceLink}>{t(profile ? 'carousel.sourceMapillary' : 'carousel.source')}</a>
      ) : null}
    </p>
  );
}
