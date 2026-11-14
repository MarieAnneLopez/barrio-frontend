import { lazy, Suspense, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import type { CategoryConfig } from '../../lib/categoryConfig';
import { ModuleList } from './ModuleList';
import { useModuleData } from './useModuleData';

// MapLibre pesa: se carga aparte, solo cuando se abre un módulo.
const ThematicMap = lazy(() => import('../../components/map/ThematicMap'));

/** Vista dual del módulo (§11.3): lista filtrable + mapa temático. */
export function ModuleDetailView({ category }: { category: CategoryConfig }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { list, features, notLoaded } = useModuleData(category.slug, page, query);
  const name = t(`categories.${category.slug}.name`);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setQuery(draft.trim());
    setPage(1);
    setSelectedId(null);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="flex flex-col gap-6">
        <form role="search" onSubmit={submit} className="flex items-end gap-2">
          <Input
            label={t('modules.search')}
            placeholder={t('modules.searchHint')}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={100}
            className="flex-1"
            disabled={notLoaded}
          />
          <Button type="submit" variant="secondary" disabled={notLoaded}>
            {t('modules.searchButton')}
          </Button>
        </form>
        <ModuleList
          list={list}
          notLoaded={notLoaded}
          searching={query !== ''}
          summary={category.summary ?? ['direccion']}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onPage={setPage}
        />
      </div>
      <div className="min-h-[420px] lg:sticky lg:top-24 lg:h-[calc(100dvh-8rem)]">
        <Suspense fallback={<Skeleton className="h-[420px] w-full" />}>
          <ThematicMap
            label={t('modules.map', { name })}
            features={features.status === 'success' ? features.data : undefined}
            emoji={category.emoji}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </Suspense>
      </div>
    </div>
  );
}
