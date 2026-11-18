import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { CATEGORIES, categoryPath } from '../../lib/categoryConfig';

const HEADING = 'mt-0 mb-3 text-step-0 text-fg';
const BUTTON =
  'ui-pressable ui-btn--secondary inline-flex min-h-11 items-center gap-2 self-start rounded-sm border border-fg bg-secondary px-4 font-medium text-on-mark no-underline';

/**
 * Franja rosa claro del pie (§11.5, D100): enlaces rápidos a los 14 módulos, la ubicación y el acceso
 * directo a Preguntas Frecuentes (el curso pide «bloque integrado o acceso directo»).
 */
export function FooterNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const lines = t('footer.locationLines', { returnObjects: true }) as string[];

  return (
    <div className="grid gap-8 md:grid-cols-[3fr_1fr]">
      <nav aria-labelledby="footer-modules">
        <h2 id="footer-modules" className={HEADING}>
          {t('footer.modules')}
        </h2>
        <ul className="m-0 grid list-none grid-cols-2 gap-x-4 p-0 lg:grid-cols-4">
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
      <section aria-labelledby="footer-location" className="flex flex-col gap-4">
        <div>
          <h2 id="footer-location" className={HEADING}>
            {t('footer.location')}
          </h2>
          <address className="flex flex-col gap-1 text-step--1 text-fg-secondary not-italic">
            {lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </address>
        </div>
        {pathname === '/preguntas' ? null : (
          <Link to="/preguntas" className={BUTTON}>
            {t('footer.faq')}
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </section>
    </div>
  );
}
