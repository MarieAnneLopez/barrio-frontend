import { expect, test, type Page } from '@playwright/test';
import { createRequire } from 'node:module';

// Gran actualización (verificación): axe en TODAS las rutas a 390, 768 y 1440 px, con movimiento
// reducido, en el modo normal y en el Alto Contraste de la app (barra de accesibilidad). Reglas WCAG
// 2.0/2.1/2.2 A y AA. La escena WebGL es un lienzo: axe revisa la interfaz que la rodea.
const AXE = createRequire(import.meta.url).resolve('axe-core/axe.min.js');
const SECTIONS = ['/', '/mapa', '/historia', '/ranking', '/galeria', '/preguntas', '/creadora', '/ayuda', '/acceso', '/creditos-fotos'];
const SLUGS = ['centros-educativos', 'escenarios-deportivos', 'camaras-seguridad', 'zonas-verdes', 'datos-catastrales',
  'estado-calles', 'estaciones-transporte', 'sitios-comida', 'librerias', 'robos', 'localidad', 'atencion-inmediata',
  'veterinarias', 'barberias'];
const ROUTES = [...SECTIONS, ...SLUGS.map((s) => `/categorias/${s}`), '/no-existe'];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

interface Violation { id: string; impact: string | null; nodes: { target: unknown[]; failureSummary?: string }[] }

test.use({ reducedMotion: 'reduce' });
test.afterEach(async ({ page }) => page.close()); // recursos (D95): cada prueba cierra su página

async function audit(page: Page, route: string, contrast: boolean): Promise<string[]> {
  await page.addInitScript((high) => {
    sessionStorage.setItem('mini-marie:welcome-seen', 'true');
    localStorage.setItem('mini-marie:a11y', JSON.stringify({ state: { highContrast: high, scaleIndex: 1, reducedMotion: true }, version: 0 }));
  }, contrast);
  await page.goto(route);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('.loading-screen')).toHaveCount(0, { timeout: 30_000 });
  if (contrast) await expect(page.locator('html')).toHaveClass(/high-contrast/);
  await page.addScriptTag({ path: AXE });
  const violations = await page.evaluate(async (tags) => {
    const axe = (window as unknown as { axe: { run: (c: unknown, o: unknown) => Promise<{ violations: Violation[] }> } }).axe;
    const result = await axe.run(document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] });
    return result.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => ({ target: n.target, failureSummary: n.failureSummary })) }));
  }, TAGS);
  const where = `${route}${contrast ? ' (alto contraste)' : ''}`;
  return violations.map((v) => `${where} · ${v.id} [${v.impact}] · ${v.nodes.length} · ${JSON.stringify(v.nodes[0]?.target)} · ${(v.nodes[0]?.failureSummary ?? '').replace(/\s+/g, ' ').slice(0, 260)}`);
}

for (const route of ROUTES) {
  test(`axe sin violaciones: ${route}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.startsWith('en-'), 'axe se mide en español a 390, 768 y 1440 px');
    const found = [...(await audit(page, route, false)), ...(await audit(page, route, true))];
    expect(found, found.join('\n')).toEqual([]);
  });
}
