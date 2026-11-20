import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminListControls } from './AdminListControls';
import type { ModuleItem } from '../../lib/apiTypes';
import type { CategoryConfig } from '../../lib/categoryConfig';
import { useSelectionStore } from '../../three/selection/selectionStore';
import { useAuthStore } from '../../store/authStore';
import { MapStage } from '../map/stage/MapStage';
import { CrudFormModal } from './CrudFormModal';
import { ItemDetailModal } from './ItemDetailModal';
import { ModuleFilters } from './ModuleFilters';
import { ModuleIntro } from './ModuleIntro';
import { ModuleList } from './ModuleList';
import { ModuleSearch } from './ModuleSearch';
import { useModuleData, type Filters } from './useModuleData';
import { useModuleMap } from './useModuleMap';

interface ModuleDetailViewProps {
  category: CategoryConfig;
  initialOpenId?: number | null;
  focusId?: number | null;
}

/** El panel puede incluir borradores mientras la maqueta conserva la colección pública. */
export function ModuleDetailView({ category, initialOpenId = null, focusId = null }: ModuleDetailViewProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({});
  const [openId, setOpenId] = useState<number | null>(initialOpenId);
  // Formulario: cerrado (null), crear (undefined) o editar un registro.
  const [editing, setEditing] = useState<ModuleItem | undefined | null>(null);
  const { slug } = category;
  const admin = useAuthStore((s) => s.user?.rol === 'admin');
  const [drafts, setDrafts] = useState(false);
  const { list, features, notLoaded, refresh } = useModuleData(slug, page, query, filters, admin && drafts);
  const showOnMap = useModuleMap(slug, features.status === 'success' ? features.data : null, focusId);
  const selectedId = useSelectionStore((s) => (s.selected?.kind === 'place' && s.selected.slug === slug ? s.selected.id : null));
  const name = t(`categories.${slug}.name`);

  const refine = (next: { query?: string; filters?: Filters }) => {
    if (next.query !== undefined) setQuery(next.query);
    if (next.filters) setFilters(next.filters);
    setPage(1);
  };

  return (
    <>
      <MapStage label={t('modules.map', { name })} title={name} emoji={category.emoji} onOpenPlace={(_, id) => setOpenId(id)}>
        <ModuleIntro category={category} />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <ModuleSearch onSearch={(q) => refine({ query: q })} disabled={notLoaded} />
          {admin && <AdminListControls drafts={drafts} notLoaded={notLoaded} onAdd={() => setEditing(undefined)}
            onDrafts={(next) => { setDrafts(next); setPage(1); }} />}
        </div>
        <ModuleFilters slug={slug} value={filters} onChange={(f) => refine({ filters: f })} disabled={notLoaded} />
        <ModuleList
          slug={slug}
          list={list}
          notLoaded={notLoaded}
          searching={query !== '' || Object.keys(filters).length > 0}
          selectedId={selectedId}
          onSelect={showOnMap}
          onOpen={setOpenId}
          onPage={setPage}
        />
      </MapStage>
      <ItemDetailModal
        slug={slug}
        itemId={openId}
        includeDrafts={admin && drafts}
        onClose={() => setOpenId(null)}
        onShowOnMap={(id) => {
          setOpenId(null);
          showOnMap(id);
        }}
        onEdit={(item) => {
          setOpenId(null);
          setEditing(item);
        }}
        onDeleted={() => {
          if (selectedId === openId) useSelectionStore.getState().select(null); // su ficha no queda con lo borrado
          setOpenId(null);
          refresh();
        }}
      />
      {admin && editing !== null && <CrudFormModal
        category={category}
        item={editing ?? undefined}
        open
        onClose={() => setEditing(null)}
        onSaved={(published) => {
          if (!published && editing?.id === selectedId) useSelectionStore.getState().select(null);
          setEditing(null);
          refresh();
        }}
      />}
    </>
  );
}
