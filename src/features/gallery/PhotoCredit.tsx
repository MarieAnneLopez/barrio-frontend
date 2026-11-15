import { useTranslation } from 'react-i18next';
import { commonsPage, licenseUrl } from '../../lib/photoUrls';

interface PhotoCreditProps {
  author: string | null;
  license: string | null;
  source?: string | null | undefined;
}

const LINK = 'text-fg-secondary underline underline-offset-2';

/** Autor, licencia (con su texto legal) y página de origen en Commons, siempre visibles. */
export function PhotoCredit({ author, license, source }: PhotoCreditProps) {
  const { t } = useTranslation();
  const legal = licenseUrl(license);
  const page = commonsPage(source);
  return (
    <p className="m-0 flex flex-wrap gap-x-3 font-mono text-[0.75rem] text-fg-secondary">
      {author ? <span>{t('carousel.credit', { author })}</span> : null}
      {license && legal ? (
        <a href={legal} target="_blank" rel="noopener noreferrer" className={LINK}>
          {t('carousel.license', { license })}
        </a>
      ) : null}
      {license && !legal ? <span>{t('carousel.license', { license })}</span> : null}
      {page ? (
        <a href={page} target="_blank" rel="noopener noreferrer" className={LINK}>
          {t('carousel.source')}
        </a>
      ) : null}
    </p>
  );
}
