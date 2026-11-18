import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CountUp } from './CountUp';

export interface Indicator {
  key: string;
  value: number;
  decimals?: number;
}

/** Indicadores clave con count-up (§11.3.1); la fuente va en la nota de la sección. */
export function Indicators({ items }: { items: Indicator[] }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-US' : 'es-CO';
  const formatters = useMemo(
    () => [0, 2].map((digits) => (n: number) => n.toLocaleString(locale, { maximumFractionDigits: digits })),
    [locale],
  );

  return (
    <dl className="m-0 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <div key={item.key} className="tone-papel flex flex-col-reverse gap-1 rounded-md border border-line bg-pink p-5">
          <dt className="text-step--1 text-fg-secondary">{t(`history.indicators.${item.key}`)}</dt>
          <dd className="m-0 font-mono text-step-3 text-fg">
            <CountUp
              value={item.value}
              decimals={item.decimals ?? 0}
              format={formatters[item.decimals ? 1 : 0] ?? String}
            />
          </dd>
        </div>
      ))}
    </dl>
  );
}
