import { useTranslation } from 'react-i18next';
import { HeroSection } from '../home/HeroSection';
import { NeighborhoodCarousel } from '../home/NeighborhoodCarousel';
import { PageHeader } from './PageHeader';

/** Inicio: título, Hero 3D (H10) y carrusel del entorno (H11). */
export function HomePage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-8">
      <PageHeader eyebrow={t('app.location')} title={t('app.title')} description={t('app.tagline')} />
      <HeroSection />
      <NeighborhoodCarousel />
    </div>
  );
}
