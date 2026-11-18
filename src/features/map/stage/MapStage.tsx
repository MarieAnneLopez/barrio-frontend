import '../vidrio.css';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { useTintal3D } from '../../../three/data/useTintal3D';
import { useSelectionStore } from '../../../three/selection/selectionStore';
import { useSkyClock } from '../../../three/sky/useSkyClock';
import { SittingMarie } from '../../home/SittingMarie';
import { SelectionCard } from '../card/SelectionCard';
import { StageBar } from './StageBar';
import { StageContext } from './stageContext';
import { StageFooter } from './StageFooter';
import { StagePanel } from './StagePanel';
import { useStageEffects } from './useStageEffects';
import { useStageParams } from './useStageParams';
import { useStageSlot } from './useStageSlot';

interface MapStageProps {
  /** Nombre de la región del mapa para el lector de pantalla. */
  label: string;
  /** Título de la sección (h1), siempre visible junto al botón del panel. */
  title: string;
  emoji?: string;
  /** Lo que acompaña al mapa (lista, leyenda): va en el panel izquierdo, oculto al principio. */
  children: ReactNode;
  /** En un módulo, «Ver ficha completa» abre su detalle ahí mismo. */
  onOpenPlace?: (slug: string, id: number) => void;
  /** Mini Marie sentada arriba a la derecha, bajo el header, como en el Inicio (solo Mapa 3D, D82, D88). */
  mascot?: boolean;
}

/**
 * Escenario de las secciones con mapa (gran actualización): la maqueta a pantalla completa (alto de
 * la ventana menos el header), con el panel izquierdo tras el botón de tres barras, la ficha de lo
 * elegido a la derecha y el pie con la cita de los datos. Expone la fase del ciclo (data-ciclo)
 * para que el vidrio y los botones ajusten su tono sin perder contraste. Escape con el foco en el
 * mapa cierra primero la ficha y después el panel.
 */
export function MapStage({ label, title, emoji, children, onOpenPlace, mascot = false }: MapStageProps) {
  const world = useTintal3D();
  const section = useRef<HTMLElement>(null);
  const slot = useStageSlot(section);
  const { phase } = useSkyClock(useReducedMotion());
  const panelId = useId();
  const menu = useRef<HTMLButtonElement>(null);
  const startsOpen = useStageParams();
  const [open, setOpen] = useState(startsOpen);
  const wide = useMediaQuery('(min-width: 768px)');
  const api = useMemo(() => ({ reveal: () => (wide ? undefined : setOpen(false)) }), [wide]);
  const close = useCallback(() => {
    setOpen(false);
    menu.current?.focus();
  }, []);
  useStageEffects(title, open, close, menu);
  // En el celular la hoja del panel tapa el centro, donde la cámara deja lo elegido: al elegir algo se
  // cierra en el mismo render que abre la ficha (el foco pasa a la ficha, useCardFocus, y no se pierde).
  useEffect(() => {
    if (wide) return undefined;
    if (useSelectionStore.getState().selected) setOpen(false);
    return useSelectionStore.subscribe((state, prev) => {
      if (state.selected && state.selected !== prev.selected) setOpen(false);
    });
  }, [wide]);

  return (
    // El relleno de arriba (no un margen) deja a Mini Marie medir desde lo alto de la página, como en el Inicio.
    <div className="relative pt-16">
      <section
        ref={section}
        data-hero
        data-ciclo={phase}
        aria-label={label}
        className="relative h-[calc(100svh-4rem)] min-h-[26rem] overflow-hidden bg-[var(--map-fondo)]"
      >
        <div ref={slot} data-scene-slot className="absolute inset-0" />
        {world.status === 'loading' ? <Skeleton className="absolute inset-0 h-full w-full" /> : null}
        <StageContext.Provider value={api}>
          <StageBar title={title} emoji={emoji} panelId={panelId} open={open} onToggle={() => setOpen((v) => !v)} menuRef={menu} />
          <StagePanel id={panelId} open={open} onClose={close}>
            {children}
          </StagePanel>
        </StageContext.Provider>
        {/* En el celular la ficha no baja de la mitad: la cámara deja el lugar en el centro, a la vista. */}
        <div className="pointer-events-none absolute top-[4.25rem] right-3 bottom-[55%] left-3 z-30 flex flex-col items-end md:right-16 md:bottom-[5.5rem] md:left-auto md:w-[22rem]">
          <SelectionCard returnFocus={menu} onOpenPlace={onOpenPlace} className="max-h-full min-h-0 w-full" />
        </div>
        <StageFooter beside={open} />
      </section>
      {mascot ? <SittingMarie stage /> : null}
    </div>
  );
}
