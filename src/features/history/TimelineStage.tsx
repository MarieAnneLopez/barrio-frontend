import { lazy, Suspense } from 'react';
import type { HingeFace } from './hinge/types';

const HingePanelCanvas = lazy(() => import('./hinge/HingePanelCanvas'));

type TimelineStageProps = {
  activeIndex: number;
  faces: ReadonlyArray<HingeFace>;
  reducedMotion: boolean;
  showCanvas: boolean;
  onUnavailable: () => void;
};

/** Superficie decorativa: el contenido de la cronología permanece como HTML. */
export function TimelineStage({
  activeIndex, faces, reducedMotion, showCanvas, onUnavailable,
}: TimelineStageProps) {
  return (
    <div data-hinge-stage aria-hidden="true" className="relative aspect-[4/3] w-full max-w-3xl">
      {showCanvas ? (
        <Suspense fallback={null}>
          <HingePanelCanvas
            activeIndex={activeIndex}
            faces={faces}
            reducedMotion={reducedMotion}
            onUnavailable={onUnavailable}
            className="absolute inset-0 size-full"
          />
        </Suspense>
      ) : null}
    </div>
  );
}
