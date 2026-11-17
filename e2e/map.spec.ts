import { expect, test, type Page } from '@playwright/test';

// MapLibre coloca cada marcador con `position: absolute` y un transform desde la esquina del mapa.
// Si otra hoja le cambia el `position`, los marcadores se colocan en fila y no señalan su lugar.
// Pasó en la etapa 3: el build repartió las hojas en otros trozos y cambió el orden de carga.
// Se mira entrando directo al módulo y llegando desde el Inicio, porque el orden puede cambiar.
async function positions(page: Page) {
  const markers = page.locator('.thematic-map .maplibregl-marker');
  await expect(markers.first()).toBeAttached({ timeout: 30_000 });
  return markers.evaluateAll((list) => list.map((el) => getComputedStyle(el).position));
}

test('mapa del módulo: cada marcador va en su sitio, no en fila', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('mini-marie:welcome-seen', 'true'));
  await page.goto('/categorias/centros-educativos');
  expect(new Set(await positions(page)), 'entrando directo').toEqual(new Set(['absolute']));

  await page.goto('/');
  await page.locator('[data-chapter="1"]').waitFor();
  await page.evaluate(() => {
    window.history.pushState({}, '', '/categorias/barberias');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  expect(new Set(await positions(page)), 'llegando desde el Inicio').toEqual(new Set(['absolute']));
});
