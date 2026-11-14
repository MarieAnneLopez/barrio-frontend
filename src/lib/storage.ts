// Acceso seguro a localStorage: puede no existir o lanzar (modo privado,
// almacenamiento bloqueado). Nunca rompe la app; solo pierde la preferencia.
const PREFIX = 'mini-marie:';

export function readPref(key: string): string | null {
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function writePref(key: string, value: string): void {
  try {
    window.localStorage.setItem(PREFIX + key, value);
  } catch {
    // Sin almacenamiento disponible: la preferencia dura solo esta visita.
  }
}
