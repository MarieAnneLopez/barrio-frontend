import { render, screen, within } from '@testing-library/react';
import { readdirSync } from 'node:fs';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthError } from '../../features/auth/AuthError';
import { KennedyFlag } from '../../features/history/KennedyFlag';
import { ModuleIntro } from '../../features/modules/ModuleIntro';
import { WriteError } from '../../features/modules/WriteError';
import { SectionPage } from '../../features/pages/SectionPage';
import { ApiError } from '../../lib/apiClient';
import { CATEGORIES } from '../../lib/categoryConfig';
import { MODES, readSrc, srcDir, THEME, tokenRatio } from '../../test/classContrast';
import { Input } from './Input';
import { LoadError } from './LoadError';
import { StarsInput } from './StarsInput';
import { StateIcon, type StateKind } from './StateIcon';

// PAL-06 (D100, DISENO-V3 §2): los estados semánticos van siempre con ícono y texto; el color
// nunca va solo. El ícono es un SVG en línea, oculto al lector de pantalla (el texto ya lo dice).
const KINDS: StateKind[] = ['error', 'warning', 'success'];
const icon = (element: HTMLElement, kind: StateKind) => element.querySelector(`svg[data-state-icon="${kind}"]`);
const inRouter = (ui: ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('StateIcon', () => {
  it.each(KINDS)('%s: SVG en línea, en el color del estado, oculto al lector y sin foco', (kind) => {
    render(<p data-testid="msg"><StateIcon kind={kind} />Texto</p>);
    const svg = icon(screen.getByTestId('msg'), kind);
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(svg).toHaveClass(`text-${kind}`);
    expect(screen.getByTestId('msg')).toHaveTextContent(/^Texto$/);
  });

  it('cada estado tiene su propio dibujo: la forma también lo dice', () => {
    const shapes = KINDS.map((kind) => render(<StateIcon kind={kind} />).container.innerHTML.replace(/data-state-icon="\w+"|text-\w+/g, ''));
    expect(new Set(shapes).size).toBe(3);
  });

  it.each(MODES)('su color se distingue sobre la superficie y el rosa claro en modo %s (≥ 3:1)', (_mode, vars) => {
    for (const kind of KINDS) {
      for (const bg of ['surface', 'pink']) {
        expect(tokenRatio(THEME.get(kind) ?? '', THEME.get(bg) ?? '', vars), `${kind} sobre ${bg}`).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

describe('cada mensaje de estado lleva su ícono', () => {
  it('errores de formulario: campo de texto y estrellas', () => {
    const { unmount } = render(<Input label="Teléfono" error="Escribe 10 dígitos" />);
    expect(icon(screen.getByRole('alert'), 'error')).not.toBeNull();
    expect(screen.getByLabelText('Teléfono')).toHaveAccessibleDescription('Escribe 10 dígitos');
    unmount();
    render(<StarsInput legend="Tu calificación" value={undefined} onChange={() => undefined} error="Elige" />);
    expect(icon(screen.getByRole('alert'), 'error')).not.toBeNull();
  });

  it('errores de la API: acceso, escritura y carga de una página', () => {
    const { unmount } = render(<AuthError error={new ApiError(401, 'INVALID_CREDENTIALS', 'x')} />);
    expect(icon(screen.getByRole('alert'), 'error')).not.toBeNull();
    unmount();
    const write = render(<WriteError error={new ApiError(422, 'VALIDATION_ERROR', 'Dato inválido')} />);
    expect(icon(screen.getByRole('alert'), 'error')).not.toBeNull();
    write.unmount();
    const retry = vi.fn();
    render(<LoadError onRetry={retry} />);
    const alert = screen.getByRole('alert');
    expect(icon(alert, 'error')).not.toBeNull();
    expect(alert).toHaveTextContent('No se pudieron cargar los datos.');
    within(alert).getByRole('button', { name: 'Reintentar' }).click();
    expect(retry).toHaveBeenCalledOnce();
  });

  it('avisos: bandera de Kennedy, advertencia de un módulo y sección en construcción', () => {
    const flag = render(<KennedyFlag />);
    expect(icon(screen.getByRole('note'), 'warning')).not.toBeNull();
    flag.unmount();
    const robos = CATEGORIES.find((category) => category.slug === 'robos');
    if (robos) render(<ModuleIntro category={robos} />);
    expect(icon(screen.getByRole('note'), 'warning')).not.toBeNull();
    inRouter(<SectionPage section="history" />);
    expect(document.querySelectorAll('svg[data-state-icon="warning"]')).toHaveLength(2);
  });

  it('todo componente con color de estado o role="alert" usa el ícono de estado', () => {
    const SEMANTIC = /\b(?:text|border|bg)-(?:error|warning|success)\b|role="alert"/;
    const files = readdirSync(srcDir, { recursive: true, encoding: 'utf8' })
      .filter((file) => file.endsWith('.tsx') && !file.includes('.test.') && !file.endsWith('StateIcon.tsx'))
      .filter((file) => SEMANTIC.test(readSrc(file)));
    expect(files.length).toBeGreaterThanOrEqual(8);
    expect(files.filter((file) => !readSrc(file).includes('<StateIcon'))).toEqual([]);
  });
});
