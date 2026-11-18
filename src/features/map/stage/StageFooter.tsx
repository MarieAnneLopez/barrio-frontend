import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { useSelectionStore } from '../../../three/selection/selectionStore';
import { MapSources } from '../card/MapSources';
import { useHoverLabel } from '../card/useHoverLabel';

/**
 * Sitio del pie en pantallas anchas: a la izquierda o, con el panel abierto, a su lado; con la ficha
 * abierta (22 rem de ancho a 4 rem del borde) termina antes de ella, así no queda debajo y cortado.
 * Con panel y ficha abiertos no cabe por debajo de xl: se esconde (las dos ya llevan la cita).
 */
function layout(beside: boolean, card: boolean): string {
  if (beside && card) return 'max-xl:hidden md:left-[24.25rem] xl:max-w-[min(36rem,calc(100%-51rem))]';
  if (beside) return 'max-md:hidden md:left-[24.25rem] md:max-w-[min(36rem,calc(100%-35rem))]';
  return card ? 'md:max-w-[min(36rem,calc(100%-27.5rem))]' : 'md:max-w-[min(36rem,calc(100%-11rem))]';
}

/**
 * Pie del escenario, abajo a la izquierda: lo que está bajo el puntero (o cómo se usa el mapa) y la
 * cita de los datos (D105). En el celular va sobre el chat y WhatsApp y deja libre la barra de
 * accesibilidad, y con el panel abierto se esconde: el panel lo taparía y ya lleva la cita al final.
 */
export function StageFooter({ beside }: { beside: boolean }) {
  const { t } = useTranslation();
  const hovered = useHoverLabel();
  const touch = useMediaQuery('(pointer: coarse)', false);
  const card = useSelectionStore((s) => s.selected !== null);

  return (
    <div
      className={`vidrio tone-papel pointer-events-auto absolute right-16 bottom-[5.25rem] left-3 z-20 flex flex-col gap-1 px-3 py-2 md:right-auto md:bottom-3 ${layout(beside, card)}`}
    >
      <p aria-live="polite" className={`m-0 font-mono text-step--1 ${hovered || !touch ? '' : 'hidden'}`}>
        {hovered ?? t('stage.hint')}
      </p>
      <MapSources bare />
    </div>
  );
}
