import { useTranslation } from 'react-i18next';

const EMAIL = 'marieanelopezpoveda@gmail.com';
const INSTAGRAM = 'https://www.instagram.com/marieane_lop/';
const LINK =
  'ui-pressable ui-btn--secondary inline-flex min-h-11 items-center gap-2 rounded-sm border-2 border-ink bg-stone px-4 font-semibold text-on-stone no-underline';

/** Contacto de la creadora (H32, D68): en el pie de todas las páginas. */
export function FooterContact() {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="footer-contact" className="ui-card ui-card--paper tone-papel flex flex-col gap-4 p-6">
      <h2 id="footer-contact" className="ui-eyebrow m-0">{t('footer.contact')}</h2>
      <p className="m-0 max-w-prose">{t('footer.contactText')}</p>
      <ul className="m-0 flex list-none flex-wrap gap-3 p-0">
        <li>
          <a href={`mailto:${EMAIL}`} target="_blank" rel="noopener noreferrer" className={LINK}>
            <span aria-hidden="true">✉</span>
            <span>{EMAIL}</span>
          </a>
        </li>
        <li>
          <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className={LINK}>
            <span aria-hidden="true">◎</span>
            <span>{t('footer.instagram')}</span>
            <span className="sr-only">{t('footer.newTab')}</span>
          </a>
        </li>
      </ul>
    </section>
  );
}
