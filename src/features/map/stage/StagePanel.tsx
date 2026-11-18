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
 * celular es una hoja abajo, de menos de la mitad del alto: termina sobre el chat y WhatsApp, deja
 * libre la barra de accesibilidad y no llega a la ficha (que no baja del 45 %), y el mapa sigue a la
 * vista y se puede usar arriba.
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
      className="vidrio tone-papel pointer-events-auto absolute right-[4.5rem] bottom-[5.5rem] left-3 z-30 max-h-[calc(55%-6.25rem)] overflow-y-auto overscroll-contain p-4 md:top-[4.25rem] md:right-auto md:bottom-3 md:max-h-none md:w-[min(22rem,calc(100%-4.5rem))]"
    >
      <div className="flex flex-col gap-4">
        {children}
        <MapSources />
      </div>
    </section>
  );
}
