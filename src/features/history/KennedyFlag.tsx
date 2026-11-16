import { useTranslation } from 'react-i18next';
import { SourceLinks } from './SourceLinks';

export const FLAG_URL = '/assets/flags/bandera_kennedy.svg';
const DECRETO = 'https://www.redjurista.com/Compilaciones2018/tablas_GacetasBogota/2021/12/7314/d_alcakennedy_0013_2021.pdf';
const COMMONS = 'https://commons.wikimedia.org/wiki/File:Bandera_de_kennedy_(bogot%C3%A1).png';

/**
 * Bandera de la Localidad de Kennedy (D56): los colores los confirma el
 * Decreto Local 13 de 2021 (art. 3) y el dibujo viene de Wikimedia Commons.
 * No hay fuente oficial de su adopción ni del significado de los colores:
 * eso queda «por verificar» y no se inventa una explicación heráldica.
 * En fila solo desde 1024 px: a 768 px, junto al menú lateral, el texto no cabía al
 * lado de la bandera y la página desbordaba 44 px.
 */
export function KennedyFlag() {
  const { t } = useTranslation();
  const stripes = ['yellow', 'white', 'green'] as const;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <img
        src={FLAG_URL}
        alt={t('history.flag.alt')}
        width={300}
        height={200}
        className="h-auto w-full max-w-[300px] rounded-sm border border-line-strong"
      />
      <div className="band-text flex max-w-prose min-w-0 flex-col gap-3 break-words">
        <p className="m-0 text-fg-secondary">{t('history.flag.design')}</p>
        <p className="m-0 text-step--1">
          <SourceLinks refs={`${DECRETO} | ${COMMONS}`} />
        </p>
        <ul className="m-0 flex flex-col gap-1 pl-5 text-fg-secondary">
          {stripes.map((stripe) => (
            <li key={stripe}>{t(`history.flag.stripes.${stripe}`)}</li>
          ))}
        </ul>
        <p role="note" className="m-0 rounded-sm border-2 border-warning bg-surface p-3 text-step--1 text-fg">
          <span className="font-medium text-warning">{t('history.unverified')}: </span>
          {t('history.flag.note')}
        </p>
      </div>
    </div>
  );
}
