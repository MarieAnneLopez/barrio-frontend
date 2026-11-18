import { useEffect, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelectionStore } from '../../../three/selection/selectionStore';

/** ¿La tecla llegó con el foco en la página o en la maqueta, sin un control de por medio? */
const onMap = (target: Element | null) => !target || target === document.body || target.closest('[data-scene-slot]') !== null;

/**
 * Efectos del escenario: el título del documento, soltar lo elegido y lo resaltado al salir de la
 * sección (la siguiente empieza sin ficha ni nombre en el pie) y Escape con el foco en el mapa:
 * cierra el panel si no hay ficha abierta (la ficha se cierra primero) y devuelve el foco al botón.
 */
export function useStageEffects(title: string, open: boolean, close: () => void, menu: RefObject<HTMLButtonElement>) {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${title} · ${t('app.shortTitle')}`;
  }, [title, t]);

  useEffect(
    () => () => {
      const { select, hover } = useSelectionStore.getState();
      select(null);
      hover(null);
    },
    [],
  );

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || !onMap(event.target as Element | null)) return;
      if (useSelectionStore.getState().selected) return;
      close();
      menu.current?.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close, menu]);
}
