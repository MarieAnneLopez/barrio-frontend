import type { ModuleItem } from '../../lib/apiTypes';
import type { Geometry as GeometryKind } from '../../lib/categoryConfig';
import type { FieldSpec } from '../../lib/moduleFields';
import type { FormValues } from './formSchema';

const text = (v: unknown) => (v === null || v === undefined ? '' : String(v));

/** Registro de la API → valores de texto del formulario (vacío si no hay registro). */
export function toFormValues(item: ModuleItem | undefined, fields: FieldSpec[], kind: GeometryKind): FormValues {
  const values: FormValues = Object.fromEntries(fields.map((f) => [f.name, text(item?.[f.name])]));
  const geometry = item?.geometry;
  if (kind === 'POINT') {
    const [lon, lat] = geometry?.type === 'Point' ? geometry.coordinates : [];
    return { ...values, lon: text(lon), lat: text(lat) };
  }
  // Editar sin tocar la geometría: el campo vacío conserva la actual.
  return { ...values, geometry: '' };
}
