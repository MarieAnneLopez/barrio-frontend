import type { TFunction } from 'i18next';
import { z } from 'zod';
import type { Geometry as GeometryKind } from '../../lib/categoryConfig';
import type { FieldSpec } from '../../lib/moduleFields';

// Encuadre de El Tintal (bbox del polígono, D38) para validar puntos antes de enviarlos.
export const TINTAL_BBOX = { west: -74.1774, south: 4.6399, east: -74.1371, north: 4.6643 };

export type FormValues = Record<string, string>;

const NUMBER = /^-?\d+([.,]\d+)?$/;
const toNumber = (v: string) => Number(v.replace(',', '.'));
// Listas de números (estrato 1–6): la API espera un entero, no texto.
const isNumericEnum = (f: FieldSpec) => f.kind === 'enum' && (f.options ?? []).every((o) => NUMBER.test(o));

function fieldRule(f: FieldSpec, t: TFunction) {
  let rule = z.string().trim();
  if (f.max) rule = rule.max(f.max, t('forms.max', { max: f.max }));
  if (f.pattern) rule = rule.regex(new RegExp(f.pattern), t('forms.pattern'));
  const checked = rule.refine((v) => !(f.required && v === ''), t('forms.required'));
  if (f.kind === 'enum') return checked.refine((v) => v === '' || (f.options ?? []).includes(v), t('forms.option'));
  if (f.kind === 'number' || f.kind === 'integer') {
    return checked
      .refine((v) => v === '' || NUMBER.test(v), t('forms.number'))
      .refine((v) => v === '' || f.kind !== 'integer' || Number.isInteger(toNumber(v)), t('forms.integer'))
      .refine((v) => v === '' || f.min === undefined || toNumber(v) >= f.min, t('forms.min', { min: f.min }))
      .refine((v) => v === '' || f.max === undefined || toNumber(v) <= f.max, t('forms.maxValue', { max: f.max }));
  }
  if (f.kind === 'date') return checked.refine((v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), t('forms.date'));
  return checked;
}

function geometryRules(kind: GeometryKind, creating: boolean, t: TFunction) {
  if (kind === 'POINT') {
    const coord = (min: number, max: number) =>
      z.string().trim().refine(
        (v) => (!creating && v === '') || (NUMBER.test(v) && toNumber(v) >= min && toNumber(v) <= max),
        t('forms.insideTintal'),
      );
    return { lon: coord(TINTAL_BBOX.west, TINTAL_BBOX.east), lat: coord(TINTAL_BBOX.south, TINTAL_BBOX.north) };
  }
  return {
    geometry: z.string().trim().refine((v) => {
      if (v === '') return !creating || kind === 'FICHA';
      try {
        return typeof (JSON.parse(v) as { type?: unknown }).type === 'string';
      } catch {
        return false;
      }
    }, t('forms.geojson')),
  };
}

/**
 * Esquema zod del formulario: todos los campos llegan como texto y se validan como la API.
 * Las claves salen de moduleFields.json en tiempo de ejecución, así que se tipa como FormValues.
 */
export function buildFormSchema(
  fields: FieldSpec[],
  kind: GeometryKind,
  creating: boolean,
  t: TFunction,
): z.ZodType<FormValues, FormValues> {
  const shape = Object.fromEntries(fields.map((f) => [f.name, fieldRule(f, t)]));
  const editorial = { descripcion_es: z.string().trim().max(1000).optional(), descripcion_en: z.string().trim().max(1000).optional(),
    publicado: z.enum(['true', 'false']).optional() };
  return z.object({ ...shape, ...editorial, ...geometryRules(kind, creating, t) }) as unknown as z.ZodType<FormValues, FormValues>;
}

/** Texto del formulario → JSON de la API: vacío = null, números, booleanos y geometría. */
export function toPayload(values: FormValues, fields: FieldSpec[], kind: GeometryKind): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = values[f.name] ?? '';
    if (v === '') out[f.name] = null;
    else if (f.kind === 'number' || f.kind === 'integer' || isNumericEnum(f)) out[f.name] = toNumber(v);
    else if (f.kind === 'boolean') out[f.name] = v === 'true';
    else out[f.name] = v;
  }
  if (kind === 'POINT' && values.lon && values.lat) {
    out.geometry = { type: 'Point', coordinates: [toNumber(values.lon), toNumber(values.lat)] };
  } else if (kind !== 'POINT' && values.geometry) out.geometry = JSON.parse(values.geometry);
  return out;
}
