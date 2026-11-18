import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { MapSources } from '../card/MapSources';
import { useHoverLabel } from '../card/useHoverLabel';

/**
 * Pie del escenario, abajo a la izquierda: lo que está bajo el puntero (o cómo se usa el mapa) y la
 * cita de los datos, siempre a la vista (D105). En el celular va sobre el chat y WhatsApp y deja
 * libre la barra de accesibilidad; en pantallas anchas va abajo y, con el panel abierto, a su lado.
 * En el celular, con el panel abierto, se esconde: el panel lo taparía y ya lleva la cita al final.
 */
export function StageFooter({ beside }: { beside: boolean }) {
  const { t } = useTranslation();
  const hovered = useHoverLabel();
  const touch = useMediaQuery('(pointer: coarse)', false);

  return (
    <div
      className={`vidrio tone-papel pointer-events-auto absolute right-16 bottom-[5.25rem] left-3 z-20 flex flex-col gap-1 px-3 py-2 md:right-auto md:bottom-3 md:max-w-[min(36rem,calc(100%-11rem))] ${
        beside ? 'max-md:hidden md:left-[24.25rem] md:max-w-[min(36rem,calc(100%-35rem))]' : ''
      }`}
    >
      <p aria-live="polite" className={`m-0 font-mono text-step--1 ${hovered || !touch ? '' : 'hidden'}`}>
        {hovered ?? t('stage.hint')}
      </p>
      <MapSources bare />
    </div>
  );
}
