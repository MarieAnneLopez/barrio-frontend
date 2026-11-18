import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { ModuleItem } from '../../lib/apiTypes';
import { mockApi } from '../../test/mockApi';
import { BASE_MAP, page } from '../../test/moduleFixtures';
import { renderRoute, setViewport } from '../../test/renderRoute';

const ROBO: ModuleItem = {
  id: 1, modalidad: 'Hurto efectuado', fecha: '2026-09-01', cantidad: 28, fuente: 'Línea 123',
  franja_horaria: null, source_type: 'datos_abiertos', source_ref: null, verified: true, geometry: null,
};

beforeEach(() => {
  window.localStorage.clear();
  setViewport(true);
});

describe('Robos: aviso ético y meses legibles', () => {
  it('muestra el aviso y el mes como texto', async () => {
    mockApi({ ...BASE_MAP, '/robos': page([ROBO]), '/robos/geojson': { body: { type: 'FeatureCollection', features: [] } } });
    renderRoute('/categorias/robos?panel=abierto');

    expect(await screen.findByRole('note')).toHaveTextContent('no denuncias ni hechos confirmados');
    expect(await screen.findByText('septiembre de 2026')).toBeInTheDocument();
  });

  it('los módulos sin aviso no muestran la nota', async () => {
    mockApi({ ...BASE_MAP, '/librerias': page([]), '/librerias/geojson': { body: { type: 'FeatureCollection', features: [] } } });
    renderRoute('/categorias/librerias?panel=abierto');

    expect(await screen.findByText('Este módulo todavía no tiene lugares registrados.')).toBeInTheDocument();
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });
});
