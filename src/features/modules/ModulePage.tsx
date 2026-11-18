import { useParams, useSearchParams } from 'react-router-dom';
import { findCategory } from '../../lib/categoryConfig';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ModuleDetailView } from './ModuleDetailView';

/** Lee un id positivo de la URL, o null. */
const idParam = (raw: string | null) => (raw && /^\d+$/.test(raw) && Number(raw) > 0 ? Number(raw) : null);

/**
 * Ruta de cada uno de los 14 módulos: /categorias/:slug, el escenario del mapa con la lista en el
 * panel. `?lugar=ID` abre la ficha completa de ese lugar (enlaces del ranking); `?enfoque=ID` lo
 * elige en la maqueta, con su ficha y la cámara sobre él (enlaces de la ficha de Mapa 3D).
 */
export function ModulePage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const category = findCategory(slug);
  if (!category) return <NotFoundPage />;

  return (
    <ModuleDetailView
      key={category.slug}
      category={category}
      initialOpenId={idParam(params.get('lugar'))}
      focusId={idParam(params.get('enfoque'))}
    />
  );
}
