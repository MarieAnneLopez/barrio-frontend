import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CATEGORIES, categoryPath } from '../../lib/categoryConfig';
import { HeroSection } from '../home/HeroSection';
import { PageHeader } from '../pages/PageHeader';

/** /mapa: la maqueta 3D de El Tintal a pantalla casi completa y los 14 mapas temáticos (Fase 3, D62). */
export function MapPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={t('nav.map')} description={t('pages.map')} />
      <HeroSection variant="page" />
      <p className="m-0 max-w-prose text-fg-secondary">{t('mapPage.explore')}</p>
      <section aria-labelledby="mapas-tematicos" className="flex flex-col gap-4">
        <h2 id="mapas-tematicos" className="m-0 text-step-2 text-fg">{t('mapPage.thematic')}</h2>
        <p className="m-0 max-w-prose text-fg-secondary">{t('mapPage.thematicIntro')}</p>
        <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((category) => (
            <li key={category.slug}>
              <Link
                to={categoryPath(category.slug)}
                className="ui-pressable ui-btn--secondary flex min-h-11 items-center gap-3 rounded-md border border-line-strong bg-surface px-4 py-3 text-fg no-underline"
              >
                <span aria-hidden="true" className="text-step-1">{category.emoji}</span>
                {t(`categories.${category.slug}.name`)}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <p className="m-0 max-w-prose text-step--1 text-fg-muted">{t('mapPage.note')}</p>
    </div>
  );
}
