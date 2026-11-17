import { expect, test, type Page } from '@playwright/test';

test.afterEach(async ({ page }) => page.close()); // recursos (D95): cada prueba cierra su página

// WCAG 2.4.11 (foco no tapado): al tabular, lo enfocado no puede quedar bajo el header fijo, los
// botones flotantes (chat, WhatsApp, barra de accesibilidad) ni, en un mapa, bajo otro marcador.
// Se mira el centro de cada parada; tapar el centro de algo grande (el lienzo del mapa) no cuenta.
async function coveredStops(page: Page, max: number): Promise<string[]> {
  const problems: string[] = [];
  const seen = new Set<number>();
  for (let i = 0; i < max; i += 1) {
    await page.keyboard.press('Tab');
    const stop = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const key = [...document.querySelectorAll('*')].indexOf(el);
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.bottom <= 0 || r.top >= innerHeight) return { key, hit: null };
      const x = Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2));
      const y = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
      const top = document.elementFromPoint(x, y);
      if (!top || el.contains(top) || top.contains(el)) return { key, hit: null };
      let fixed = false;
      for (let n: Element | null = top; n && !fixed; n = n.parentElement) fixed = getComputedStyle(n).position === 'fixed';
      const marker = el.classList.contains('map-marker') && top.closest('.map-marker') !== null;
      const what = `${el.tagName.toLowerCase()} «${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 30)}»`;
      return { key, hit: fixed || marker ? `${what} bajo <${top.tagName.toLowerCase()} class="${String(top.className).slice(0, 40)}">` : null };
    });
    if (!stop) continue;
    if (seen.has(stop.key)) break; // dio la vuelta a la página
    seen.add(stop.key);
    if (stop.hit) problems.push(stop.hit);
  }
  return problems;
}

for (const route of ['/creditos-fotos', '/categorias/barberias']) {
  test(`${route}: al tabular, nada queda bajo el header, los botones flotantes ni otro marcador`, async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('mini-marie:welcome-seen', 'true'));
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    await page.locator('.loading-screen').waitFor({ state: 'detached', timeout: 30_000 });
    expect(await coveredStops(page, 90)).toEqual([]);
  });
}
