import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { readSrc, srcDir } from '../../test/classContrast';
import { stateGaps } from '../../test/stateScan';

// PAL-06 (D100, DISENO-V3 §2): todo mensaje de error, aviso o éxito lleva su ícono y su texto. El
// escáner mira cada mensaje (no basta con un ícono en el archivo) y también las regiones vivas
// (aria-live, role="status"), por donde llegan mensajes de estado sin clase de color ni role="alert".
const ICON = '<StateIcon kind="error" />';

describe('escáner de mensajes de estado', () => {
  it('un ícono por mensaje: dos mensajes y un solo ícono no pasan', () => {
    const two = `<><p role="alert">${ICON}Uno</p><p className="text-error">Dos</p></>`;
    expect(stateGaps(two)).toHaveLength(1);
    expect(stateGaps(`<p role="alert">${ICON}Uno</p>`)).toEqual([]);
  });

  it('lo que va dentro de un mensaje con ícono es parte de él', () => {
    const nested = `<p role="note" className="border border-warning">${ICON}<span className="text-warning">Ojo:</span> x</p>`;
    expect(stateGaps(nested)).toEqual([]);
  });

  it('una región viva sin ícono cuenta, salvo las que el archivo declara neutras', () => {
    const live = `<div><p aria-live="polite">{done ? t('ok') : t('fail')}</p><span role="status">{n}</span></div>`;
    expect(stateGaps(live)).toHaveLength(1);
    expect(stateGaps(live, 2)).toEqual([]);
    expect(stateGaps(`<p aria-live="polite">{done ? <>${ICON}{t('ok')}</> : null}</p>`)).toEqual([]);
  });
});

/** Regiones vivas que nunca anuncian un error, un aviso ni un éxito, por archivo (cuántas y qué dicen). */
const NEUTRAL_LIVE: Record<string, [number, string]> = {
  'components/avatar/LoadingScreen.tsx': [1, 'pantalla de carga'],
  'components/chat/ChatPanel.tsx': [1, '«pensando…» del chat'],
  'components/layout/AccessibilityRail.tsx': [1, 'tamaño de la letra'],
  'components/ui/Skeleton.tsx': [1, 'cargando'],
  'features/gallery/ribbon/PhotoRibbon.tsx': [1, 'foto actual'],
  'features/home/film/reel/ModuleReel.tsx': [1, 'descripción del módulo'],
  'features/history/TimelineNav.tsx': [1, 'hito n de m'],
  'features/home/HeroHud.tsx': [1, 'lugar señalado en la maqueta'],
  'features/home/NeighborhoodCarousel.tsx': [1, 'diapositiva actual'],
  'features/map/stage/StageFooter.tsx': [1, 'lugar señalado en el mapa'],
  'features/modules/GalleryLightbox.tsx': [1, 'foto n de m'],
  'features/modules/ModuleList.tsx': [1, 'cuántos resultados hay'],
  'features/modules/Pagination.tsx': [1, 'página n de m'],
};

describe('mensajes de estado del código', () => {
  const files = readdirSync(srcDir, { recursive: true, encoding: 'utf8' })
    .map((file) => file.replaceAll('\\', '/'))
    .filter((file) => file.endsWith('.tsx') && !file.includes('.test.') && !file.endsWith('StateIcon.tsx'));

  it('lee de verdad los componentes: sin su ícono, un mensaje real y una región viva real no pasan', () => {
    expect(files.length).toBeGreaterThan(100);
    for (const file of Object.keys(NEUTRAL_LIVE)) expect(files).toContain(file);
    const withoutIcons = (file: string) => readSrc(file).replace(/<StateIcon [^>]*\/>/g, '');
    for (const file of ['app/RouteError.tsx', 'features/history/KennedyFlag.tsx', 'features/modules/RatingForm.tsx']) {
      expect(stateGaps(withoutIcons(file)), file).toHaveLength(1);
    }
  });

  it('cada archivo declara exactamente las regiones neutras que tiene (ni una de sobra)', () => {
    for (const [file, [count]] of Object.entries(NEUTRAL_LIVE)) expect(stateGaps(readSrc(file), count - 1), file).toHaveLength(1);
  });

  it('cada mensaje de estado y cada región viva que no es neutra llevan su ícono', () => {
    const gaps = files.flatMap((file) => stateGaps(readSrc(file), NEUTRAL_LIVE[file]?.[0]).map((gap) => `${file}: ${gap}`));
    expect(gaps).toEqual([]);
  });
});
