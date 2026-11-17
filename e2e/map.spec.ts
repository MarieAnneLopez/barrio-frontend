import { expect, test, type Page } from '@playwright/test';

// MapLibre coloca cada marcador con `position: absolute` y un transform desde la esquina del mapa.
// Si otra hoja le cambia el `position`, los marcadores se colocan en fila y no señalan su lugar.
// Pasó en la etapa 3: el build repartió las hojas en otros trozos y cambió el orden de carga.
// Se mira entrando directo al módulo y llegando desde el Inicio, porque el orden puede cambiar.
async function positions(page: Page) {
  const markers = page.locator('.thematic-map .maplibregl-marker');
  await expect(markers.first()).toBeAttached({ timeout: 60_000 }); // con 5 navegadores a la vez, WebGL va lento
  return markers.evaluateAll((list) => list.map((el) => getComputedStyle(el).position));
}

test('mapa del módulo: cada marcador va en su sitio, no en fila', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('mini-marie:welcome-seen', 'true'));
  await page.goto('/categorias/centros-educativos');
  expect(new Set(await positions(page)), 'entrando directo').toEqual(new Set(['absolute']));

  await page.goto('/');
  await page.locator('[data-chapter="1"]').waitFor();
  await page.locator('.loading-screen').waitFor({ state: 'detached', timeout: 60_000 }); // el Inicio ya cargó sus trozos
  await page.evaluate(() => {
    window.history.pushState({}, '', '/categorias/barberias');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  expect(new Set(await positions(page)), 'llegando desde el Inicio').toEqual(new Set(['absolute']));
});

// maplibre-gl.css pone Helvetica Neue a todo el mapa y un anillo de 2 px a los controles; la interfaz
// usa Inter (como las etiquetas de la maqueta 3D) y no lleva sombras duras (§10).
test('mapa del módulo: etiquetas en Inter y controles sin el anillo de maplibre', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('mini-marie:welcome-seen', 'true'));
  await page.goto('/categorias/centros-educativos');
  const label = page.locator('.thematic-map .map-marker__label').first();
  await expect(label).toBeAttached({ timeout: 30_000 });
  expect(await label.evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/^"?Inter/);
  const shadows = await page.locator('.thematic-map .maplibregl-ctrl-group').evaluateAll((list) => list.map((el) => getComputedStyle(el).boxShadow));
  expect(shadows.length).toBeGreaterThan(0);
  expect(new Set(shadows)).toEqual(new Set(['none']));
});
