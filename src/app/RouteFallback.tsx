import { LoadingTask } from '../components/avatar/LoadingTask';

/**
 * Lo que hay en <main> mientras llega el código de una página: la pantalla de carga completa (H33) y
 * un hueco de una pantalla de alto (D114). Sin él, <main> quedaba vacío y el pie (más alto que la
 * pantalla en un celular) la llenaba; al pintarse la página bajaba de golpe: CLS 0,77 en Lighthouse.
 */
export function RouteFallback() {
  return (
    <>
      <div aria-hidden="true" className="min-h-svh" />
      <LoadingTask />
    </>
  );
}
