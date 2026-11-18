import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { MapSources } from '../card/MapSources';

interface StagePanelProps {
  id: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Panel izquierdo del escenario: lo que acompañaba al mapa (lista del módulo, leyenda y filtro).
 * Oculto al principio; estrecho, para que el mapa siga a la vista y se pueda usar. Mismo vidrio
 * que la ficha. Cerrado queda montado (`hidden`): conserva búsqueda, filtros y desplazamiento.
 * Escape dentro de él lo cierra (y el escenario devuelve el foco al botón de tres barras). En el
 * celular termina sobre el chat y WhatsApp y deja libre la barra de accesibilidad.
 */
export function StagePanel({ id, open, onClose, children }: StagePanelProps) {
  const { t } = useTranslation();
  return (
    <section
      id={id}
      aria-label={t('stage.panel')}
      hidden={!open}
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || event.defaultPrevented) return;
        event.preventDefault();
        onClose();
      }}
      className="vidrio tone-papel pointer-events-auto absolute top-[4.25rem] bottom-[5.5rem] left-3 z-30 w-[min(22rem,calc(100%-4.5rem))] overflow-y-auto overscroll-contain p-4 md:bottom-3"
    >
      <div className="flex flex-col gap-4">
        {children}
        <MapSources />
      </div>
    </section>
  );
}
