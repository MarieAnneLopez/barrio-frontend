import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { FaqSection } from '../../features/faq/FaqSection';
import { CreatorProfileSection } from '../../features/profile/CreatorProfileSection';
import { CATEGORIES, categoryPath } from '../../lib/categoryConfig';
import { FooterContact } from './FooterContact';

const FOOTER_FAQ_COUNT = 4;
const HEADING = 'mt-0 mb-4 text-step-0 text-fg';

/**
 * Pie institucional (§11.5, D2: al final de cada página, no fijo), en banda marrón (D96): contacto,
 * Perfil de la Creadora, preguntas frecuentes, 14 módulos y ubicación. En /preguntas y /creadora
 * omite el bloque que ya ocupa la página.
 */
export function Footer() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const lines = t('footer.locationLines', { returnObjects: true }) as string[];

  return (
    <footer aria-label={t('footer.label')} className="tone-papel mt-16 bg-band">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-4 py-12 md:pr-20 md:pl-10 xl:px-10">
        <FooterContact />
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          {pathname === '/creadora' ? null : <CreatorProfileSection headingLevel={2} />}
          {pathname === '/preguntas' ? null : (
            <section aria-labelledby="footer-faq" className="flex flex-col gap-4">
              <h2 id="footer-faq" className="m-0 text-step-1 text-fg">
                {t('footer.faq')}
              </h2>
              <FaqSection headingLevel={3} limit={FOOTER_FAQ_COUNT} />
              <Link to="/preguntas" className="self-start text-accent underline underline-offset-4">
                {t('footer.seeAllFaq')}
              </Link>
            </section>
          )}
        </div>
        <div className="grid gap-10 md:grid-cols-[2fr_1fr]">
          <nav aria-labelledby="footer-modules">
            <h2 id="footer-modules" className={HEADING}>
              {t('footer.modules')}
            </h2>
            <ul className="m-0 grid list-none grid-cols-1 gap-x-6 gap-y-1 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map((category) => (
                <li key={category.slug}>
                  <Link
                    to={categoryPath(category.slug)}
                    className="inline-flex min-h-11 items-center gap-2 text-step--1 text-fg-secondary no-underline hover:text-fg hover:underline"
                  >
                    <span aria-hidden="true">{category.emoji}</span>
                    {t(`categories.${category.slug}.name`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <section aria-labelledby="footer-location">
            <h2 id="footer-location" className={HEADING}>
              {t('footer.location')}
            </h2>
            <address className="flex flex-col gap-1 text-step--1 text-fg-secondary not-italic">
              {lines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </address>
          </section>
        </div>
        <p className="m-0 flex flex-wrap gap-x-4 font-mono text-step--1 text-fg-muted">
          <span>{t('footer.rights')}</span>
          <span>{t('footer.academic')}</span>
          <Link to="/creditos-fotos" className="text-fg-secondary underline underline-offset-4">
            {t('credits.link')}
          </Link>
        </p>
      </div>
    </footer>
  );
}
