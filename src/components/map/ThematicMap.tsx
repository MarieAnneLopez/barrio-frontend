import 'maplibre-gl/dist/maplibre-gl.css';
import './map.css';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ModuleFeatures } from '../../lib/apiTypes';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { useMapInstance } from './useMapInstance';
import { useMarkers } from './useMarkers';
import { useShapes } from './useShapes';

export interface ThematicMapProps {
  /** Módulo: da el nombre visible de cada marcador. */
  slug: string;
  /** Nombre accesible de la región del mapa. */
  label: string;
  features: ModuleFeatures | undefined;
  emoji: string;
  selectedId: number | null;
  onSelect: (id: number) => void;
}

/** Mapa temático MapLibre sobre el mapa base local de El Tintal (D5). */
export default function ThematicMap({ slug, label, features, emoji, selectedId, onSelect }: ThematicMapProps) {
  const { t } = useTranslation();
  const container = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0);
  const { map, status } = useMapInstance(container, attempt);
  const reducedMotion = useReducedMotion(); // barra de accesibilidad o sistema (H30)
  useMarkers({ map, slug, features, emoji, selectedId, onSelect, reducedMotion });
  useShapes({ map, features, selectedId, onSelect, reducedMotion });

  return (
    <section aria-label={label} className="thematic-map h-[420px] lg:h-full">
      <div ref={container} className="absolute inset-0" />
      {status === 'loading' ? (
        <div className="absolute inset-0 p-4">
          <Skeleton className="h-full w-full" />
        </div>
      ) : null}
      {status === 'error' ? (
        <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="m-0 text-fg-secondary">{t('modules.mapError')}</p>
          <Button variant="secondary" size="sm" onClick={() => setAttempt((n) => n + 1)}>
            {t('modules.retry')}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
