import { expect, test, type Page } from '@playwright/test';

// H31: ninguna ruta puede dejar errores sin capturar ni errores de consola, al entrar,
// salir navegando dentro del sitio, recargar o volver atrás.
const SECTIONS = ['/', '/mapa', '/historia', '/ranking', '/galeria', '/preguntas', '/creadora', '/ayuda', '/acceso'];
const SLUGS = ['centros-educativos', 'escenarios-deportivos', 'camaras-seguridad', 'zonas-verdes', 'datos-catastrales',
  'estado-calles', 'estaciones-transporte', 'sitios-comida', 'librerias', 'robos', 'localidad', 'atencion-inmediata',
  'veterinarias', 'barberias'];
const ROUTES = [...SECTIONS, ...SLUGS.map((s) => `/categorias/${s}`), '/no-existe'];

async function settle(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}

/** Navegación dentro de la app (como un clic del visitante), sin recargar. */
async function go(page: Page, path: string) {
  await page.evaluate((p) => {
    window.history.pushState({}, '', p);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
  await settle(page);
}

test('todas las rutas: entrar, salir, recargar y volver sin errores', async ({ page }) => {
  const errors: string[] = [];
  let step = 'inicio';
  page.on('pageerror', (e) => errors.push(`${step} · pageerror · ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`${step} · console · ${m.text().slice(0, 200)}`);
  });
  await page.addInitScript(() => sessionStorage.setItem('mini-marie:welcome-seen', 'true'));
  await page.goto('/');
  await settle(page);

  for (const route of ROUTES) {
    step = `entrar ${route}`;
    await go(page, route);
    await expect(page.getByText('Unexpected Application Error')).toHaveCount(0);
    step = `salir de ${route}`;
    await go(page, '/historia');
    step = `recargar ${route}`;
    await go(page, route);
    await page.reload();
    await settle(page);
    step = `atrás desde ${route}`;
    await page.goBack();
    await settle(page);
  }
  for (const [i, slug] of SLUGS.entries()) {
    step = `de ${slug} a la siguiente categoría`;
    await go(page, `/categorias/${slug}`);
    await go(page, `/categorias/${SLUGS[(i + 1) % SLUGS.length]}`);
  }
  expect(errors, errors.join('\n')).toEqual([]);
});
