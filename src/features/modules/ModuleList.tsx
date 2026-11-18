import { useTranslation } from 'react-i18next';
import { LoadError } from '../../components/ui/LoadError';
import { Skeleton } from '../../components/ui/Skeleton';
import type { ApiState } from '../../hooks/useApi';
import type { ModuleItem, Page } from '../../lib/apiTypes';
import { ItemCard } from './ItemCard';
import { Pagination } from './Pagination';

interface ModuleListProps {
  slug: string;
  list: ApiState<Page<ModuleItem>> & { retry: () => void };
  notLoaded: boolean;
  searching: boolean;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onOpen: (id: number) => void;
  onPage: (page: number) => void;
}

/** Lista con sus estados: cargando, error, módulo sin datos, vacío y resultados. */
export function ModuleList(props: ModuleListProps) {
  const { slug, list, notLoaded, searching, selectedId, onSelect, onOpen, onPage } = props;
  const { t } = useTranslation();

  if (notLoaded) {
    return <p className="m-0 rounded-md border border-dashed border-line p-6 text-fg-secondary">{t('modules.notLoaded')}</p>;
  }
  if (list.status === 'loading') return <Skeleton className="h-24 w-full" lines={3} />;
  if (list.status === 'error') return <LoadError onRetry={list.retry} />;
  const page = list.data;
  if (page.total === 0) {
    return (
      <p className="m-0 rounded-md border border-dashed border-line p-6 text-fg-secondary">
        {searching ? t('modules.empty') : t('modules.emptyModule')}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <h2 className="sr-only">{t('modules.list')}</h2>
      <p className="m-0 font-mono text-step--1 text-fg-muted" aria-live="polite">
        {t('modules.results', { count: page.total })}
      </p>
      <ul aria-label={t('modules.list')} className="m-0 flex list-none flex-col gap-3 p-0">
        {page.items.map((item) => (
          <ItemCard
            key={item.id}
            slug={slug}
            item={item}
            selected={item.id === selectedId}
            onShowOnMap={onSelect}
            onOpen={onOpen}
          />
        ))}
      </ul>
      <Pagination page={page.page} pages={page.pages} onChange={onPage} />
    </div>
  );
}
