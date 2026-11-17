import './reel-grid.css';
import './reel-tile.css';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CATEGORIES, categoryPath } from '../../../../lib/categoryConfig';
import type { Cover } from './coverLayout';

/**
 * Rejilla estática de enlaces a los 14 módulos, con la misma portada tipográfica (número y nombre)
 * hecha en HTML. Es lo que se ve mientras llega el motor WebGL, y lo que queda si no hay WebGL.
 */
export function ReelGrid({ covers }: { covers: readonly Cover[] }) {
  const { t } = useTranslation();
  return (
    <nav aria-label={t('home.reel.label')} className="reel-grid">
      <ul className="reel-grid__list">
        {CATEGORIES.map((category, index) => (
          <li key={category.slug}>
            <Link to={categoryPath(category.slug)} className="reel-tile tone-noche ui-pressable">
              <span className="reel-tile__number">{covers[index]?.number}</span>{' '}
              <span className="reel-tile__name">{covers[index]?.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
