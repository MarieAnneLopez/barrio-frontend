import { useTranslation } from 'react-i18next';
import { PageHeader } from './PageHeader';

/** Inicio: aquí llegan el Hero 3D (H10) y el carrusel (H11). */
export function HomePage() {
  const { t } = useTranslation();
  return (
    <PageHeader
      eyebrow={t('app.location')}
      title={t('app.title')}
      description={t('app.tagline')}
    />
  );
}
