import { describe, expect, it } from 'vitest';
import i18n from '../../i18n/i18n';
import { moduleFields } from '../../lib/moduleFields';
import { buildFormSchema, toPayload } from './formSchema';

const t = i18n.t.bind(i18n);
const issues = (result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  Object.fromEntries((result.error?.issues ?? []).map((i) => [String(i.path[0]), i.message]));

describe('buildFormSchema', () => {
  const barber = moduleFields('barberias').fields;

  it('exige los obligatorios y que el punto quede dentro de El Tintal al crear', () => {
    const schema = buildFormSchema(barber, 'POINT', true, t);
    const result = schema.safeParse({ nombre: '', direccion: '', horario: '', servicios: '', lon: '-74.0', lat: '' });

    expect(issues(result)).toEqual({
      nombre: 'Este campo es obligatorio',
      lon: 'Debe quedar dentro de El Tintal',
      lat: 'Debe quedar dentro de El Tintal',
    });
  });

  it('al editar, coordenadas vacías conservan la geometría', () => {
    const schema = buildFormSchema(barber, 'POINT', false, t);
    expect(schema.safeParse({ nombre: 'Kings', direccion: '', horario: '', servicios: '', lon: '', lat: '' }).success).toBe(true);
  });

  it('valida listas, números enteros, rangos y patrones del catastro', () => {
    const fields = moduleFields('datos-catastrales').fields;
    const base = Object.fromEntries(fields.map((f) => [f.name, '']));
    const schema = buildFormSchema(fields, 'POLYGON', false, t);
    const result = schema.safeParse({
      ...base, matricula_inmobiliaria: '50C 1', pisos: '2.5', estrato: '7', area_lote_m2: '-3', geometry: '{nope',
    });

    expect(issues(result)).toMatchObject({
      matricula_inmobiliaria: 'Formato no válido', pisos: 'Escribe un número entero',
      estrato: 'Elige una opción de la lista', area_lote_m2: 'Mínimo 0', geometry: 'Pega una geometría GeoJSON válida',
    });
  });
});

describe('toPayload', () => {
  it('convierte texto en los tipos de la API', () => {
    const fields = moduleFields('escenarios-deportivos').fields;
    const body = toPayload(
      { nombre: 'Cancha', deportes: 'fútbol', superficie: '', iluminacion: 'true', horario: '', acceso: 'libre',
        geometry: '{"type":"Polygon","coordinates":[]}' },
      fields, 'POLYGON',
    );

    expect(body).toEqual({ nombre: 'Cancha', deportes: 'fútbol', superficie: null, iluminacion: true, horario: null,
      acceso: 'libre', geometry: { type: 'Polygon', coordinates: [] } });
  });

  it('estrato viaja como número y el punto como GeoJSON', () => {
    const lot = toPayload({ matricula_inmobiliaria: '1', estrato: '2', pisos: '3' },
      moduleFields('datos-catastrales').fields, 'POLYGON');
    const shop = toPayload({ nombre: 'X', lon: '-74,155', lat: '4.643' }, moduleFields('barberias').fields, 'POINT');

    expect([lot.estrato, lot.pisos, lot.geometry]).toEqual([2, 3, undefined]);
    expect(shop.geometry).toEqual({ type: 'Point', coordinates: [-74.155, 4.643] });
  });
});
