import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { CreatorProfileSection } from '../../features/profile/CreatorProfileSection';
import { FooterContact } from './FooterContact';
import { FooterNav } from './FooterNav';
import { footerTones, toneAttrs } from './footerTones';

const COLUMN = 'mx-auto w-full max-w-[1200px] px-4 md:pr-20 md:pl-10 xl:px-10';

/**
 * Pie institucional (§11.5, D2: al final de cada página, no fijo), compacto y en la paleta D100:
 * dos tarjetas sobre crema (contacto y Perfil de la Creadora) con el tono que pide el plan de color
 * de la ruta (footerTones), una franja (rosa claro desde 768 px; en el celular sería casi una
 * pantalla de rosa claro) con los 14 módulos, la ubicación y el acceso a Preguntas Frecuentes,
 * una barra amarilla con los créditos y la banda marrón con el nombre del sitio en crema grande
 * (3,56:1 solo vale para texto grande). En /creadora omite su tarjeta.
 */
export function Footer() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const tones = footerTones(pathname);
  const withCreator = pathname !== '/creadora';

  return (
    <footer aria-label={t('footer.label')} className="mt-16">
      <div className={`${COLUMN} grid gap-6 pb-12 ${withCreator ? 'lg:grid-cols-2' : ''}`}>
        <section
          aria-labelledby="footer-contact"
          className="foot-card tone-papel flex flex-col justify-center p-6"
          {...toneAttrs(tones.contact)}
        >
          <FooterContact />
        </section>
        {withCreator ? <CreatorProfileSection headingLevel={2} tone={tones.creator} /> : null}
      </div>
      <div className="tone-papel md:bg-pink">
        <div className={`${COLUMN} py-10`}>
          <FooterNav />
        </div>
      </div>
      <div className="bg-mark text-on-mark">
        <p className={`${COLUMN} m-0 flex flex-wrap gap-x-6 gap-y-1 py-3 font-mono text-step--1`}>
          <span>{t('footer.rights')}</span>
          <span>{t('footer.academic')}</span>
          <Link to="/creditos-fotos" className="text-on-mark underline underline-offset-4">
            {t('credits.link')}
          </Link>
        </p>
      </div>
      <div className="bg-band">
        <p className={`${COLUMN} m-0 py-5 font-display text-step-4 text-on-band md:py-3 md:text-step-3`}>{t('app.title')}</p>
      </div>
    </footer>
  );
}
