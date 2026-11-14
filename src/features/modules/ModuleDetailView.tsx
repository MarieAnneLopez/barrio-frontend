import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import type { ModuleItem } from '../../lib/apiTypes';
import type { CategoryConfig } from '../../lib/categoryConfig';
import { CrudFormModal } from './CrudFormModal';
import { ItemDetailModal } from './ItemDetailModal';
import { ModuleFilters } from './ModuleFilters';
import { ModuleList } from './ModuleList';
import { ModuleSearch } from './ModuleSearch';
import { useModuleData, type Filters } from './useModuleData';

// MapLibre pesa: se carga aparte, solo cuando se abre un módulo.
const ThematicMap = lazy(() => import('../../components/map/ThematicMap'));

/** Vista dual del módulo (§11.3): lista filtrable + mapa temático + ficha de detalle. */
export function ModuleDetailView({ category, initialOpenId = null }: { category: CategoryConfig; initialOpenId?: number | null }) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [openId, setOpenId] = useState<number | null>(initialOpenId);
  // Formulario: cerrado (null), crear (undefined) o editar un registro.
  const [editing, setEditing] = useState<ModuleItem | undefined | null>(null);
  const { slug } = category;
  const { list, features, notLoaded, refresh } = useModuleData(slug, page, query, filters);
  const name = t(`categories.${slug}.name`);

  const refine = (next: { query?: string; filters?: Filters }) => {
    if (next.query !== undefined) setQuery(next.query);
    if (next.filters) setFilters(next.filters);
    setPage(1);
    setSelectedId(null);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <ModuleSearch onSearch={(q) => refine({ query: q })} disabled={notLoaded} />
          <Button variant="secondary" onClick={() => setEditing(undefined)} disabled={notLoaded}>
            {t('forms.add')}
          </Button>
        </div>
        <ModuleFilters slug={slug} value={filters} onChange={(f) => refine({ filters: f })} disabled={notLoaded} />
        <ModuleList
          slug={slug}
          list={list}
          notLoaded={notLoaded}
          searching={query !== '' || Object.keys(filters).length > 0}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onOpen={setOpenId}
          onPage={setPage}
        />
      </div>
      <div className="min-h-[420px] lg:sticky lg:top-24 lg:h-[calc(100dvh-8rem)]">
        <Suspense fallback={<Skeleton className="h-[420px] w-full" />}>
          <ThematicMap
            slug={slug}
            label={t('modules.map', { name })}
            features={features.status === 'success' ? features.data : undefined}
            emoji={category.emoji}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </Suspense>
      </div>
      <ItemDetailModal
        slug={slug}
        itemId={openId}
        onClose={() => setOpenId(null)}
        onEdit={(item) => {
          setOpenId(null);
          setEditing(item);
        }}
        onDeleted={() => {
          setOpenId(null);
          refresh();
        }}
      />
      <CrudFormModal
        category={category}
        item={editing ?? undefined}
        open={editing !== null}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          refresh();
        }}
      />
    </div>
  );
}
