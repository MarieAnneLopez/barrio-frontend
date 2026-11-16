import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { PageHeader } from '../pages/PageHeader';
import { Indicators } from './Indicators';
import { KennedyFlag } from './KennedyFlag';
import { LocatorMap } from './LocatorMap';
import { SourceLinks } from './SourceLinks';
import { SourcesList } from './SourcesList';
import { Timeline } from './Timeline';
import { useHistoryData } from './useHistoryData';

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-5">
      <h2 id={id} className="m-0 text-step-2 text-fg">{title}</h2>
      {children}
    </section>
  );
}

/** Historia Local (§11.3.1, H20): línea de tiempo, bandera, indicadores, ubicación y fuentes. */
export function HistoryPage() {
  const { t } = useTranslation();
  const { historia, kennedy, tintal, indicators } = useHistoryData();

  return (
    <div className="flex flex-col gap-12">
      <PageHeader title={t('nav.history')} description={t('pages.history')} />
      <Section id="historia-linea" title={t('history.timeline')}>
        {historia.status === 'loading' ? <Skeleton className="h-40 w-full" lines={5} /> : null}
        {historia.status === 'error' ? (
          <div role="alert" className="flex flex-col items-start gap-3 rounded-sm border-2 border-error bg-surface p-6">
            <p className="m-0 text-fg">{t('modules.error')}</p>
            <Button variant="secondary" size="sm" onClick={historia.retry}>{t('modules.retry')}</Button>
          </div>
        ) : null}
        {historia.status === 'success' ? <Timeline hitos={historia.data.hitos} fuentes={historia.data.fuentes} /> : null}
      </Section>
      <Section id="historia-bandera" title={t('history.flag.title')}>
        <KennedyFlag />
      </Section>
      <Section id="historia-cifras" title={t('history.indicators.title')}>
        {indicators.length ? <Indicators items={indicators} /> : <Skeleton className="h-24 w-full" />}
        <p className="m-0 max-w-prose text-step--1 text-fg-muted">
          {t('history.indicators.note')} <SourceLinks refs={kennedy?.source_ref ?? null} />
        </p>
      </Section>
      <Section id="historia-ubicacion" title={t('history.locator.title')}>
        {kennedy?.geometry && tintal ? (
          <LocatorMap kennedy={kennedy.geometry} tintal={tintal.geometry} />
        ) : (
          <Skeleton className="h-64 w-full max-w-md" />
        )}
        <p className="ui-prose m-0 text-step--1">{t('history.locator.definition')}</p>
      </Section>
      {historia.status === 'success' ? (
        <Section id="historia-fuentes" title={t('history.sources.title')}>
          <SourcesList fuentes={historia.data.fuentes} consultado={historia.data.consultado} />
        </Section>
      ) : null}
    </div>
  );
}
