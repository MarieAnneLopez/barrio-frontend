import { useTranslation } from 'react-i18next';

export const FLAG_URL = '/assets/flags/bandera_kennedy.svg';

/**
 * Bandera de la Localidad de Kennedy (D55): diseño según Wikimedia Commons.
 * No hay fuente oficial de su adopción ni del significado de los colores, así
 * que se dice «por verificar» y no se inventa una explicación heráldica.
 */
export function KennedyFlag() {
  const { t } = useTranslation();
  const stripes = ['yellow', 'white', 'green'] as const;

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start">
      <img
        src={FLAG_URL}
        alt={t('history.flag.alt')}
        width={300}
        height={200}
        className="h-auto w-full max-w-[300px] rounded-sm border border-line-strong"
      />
      <div className="flex max-w-prose flex-col gap-3">
        <p className="m-0 text-fg-secondary">{t('history.flag.design')}</p>
        <ul className="m-0 flex flex-col gap-1 pl-5 text-fg-secondary">
          {stripes.map((stripe) => (
            <li key={stripe}>{t(`history.flag.stripes.${stripe}`)}</li>
          ))}
        </ul>
        <p role="note" className="m-0 rounded-md border border-warning p-3 text-step--1 text-fg">
          <span className="font-medium text-warning">{t('history.unverified')}: </span>
          {t('history.flag.note')}
        </p>
      </div>
    </div>
  );
}
