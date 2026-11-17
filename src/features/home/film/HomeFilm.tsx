import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PhotoFlight } from './flight/PhotoFlight';
import { Manifesto } from './manifesto/Manifesto';
import { ModuleReel } from './reel/ModuleReel';
import { ModelStage } from './stage/ModelStage';

/**
 * Inicio (etapa 3): una película de scroll a pantalla completa en 4 capítulos (1100 svh).
 * 1 manifiesto elástico · 2 vuelo entre fotos · 3 maqueta 3D · 4 reel de los 14 módulos.
 * El scroll es siempre el nativo; cada capítulo declara el tono del header que flota sobre él.
 * Al final, fuera de la escena, el enlace discreto a los créditos de las fotos.
 */
export function HomeFilm() {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = `${t('app.title')} · ${t('app.shortTitle')}`;
  }, [t]);

  return (
    <>
      <Manifesto />
      <PhotoFlight />
      <ModelStage />
      <ModuleReel />
      <p className="mx-auto mb-0 w-full max-w-[1200px] px-4 py-6 text-step--1 md:px-10">
        <Link to="/creditos-fotos" className="text-fg-secondary underline underline-offset-4">
          {t('credits.link')}
        </Link>
      </p>
    </>
  );
}
