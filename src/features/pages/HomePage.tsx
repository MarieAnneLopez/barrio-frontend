import { useTranslation } from 'react-i18next';
import { HeroSection } from '../home/HeroSection';
import { PageHeader } from './PageHeader';

/** Inicio: título, Hero 3D (H10) y, en H11, el carrusel del entorno. */
export function HomePage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow={t('app.location')} title={t('app.title')} description={t('app.tagline')} />
      <HeroSection />
    </div>
  );
}
