import { expect, test } from '@playwright/test';

// Etapa 3 (interfaz elegante): el Inicio es una película de 4 capítulos. Aquí se mide en el
// navegador lo que jsdom no puede: el alto del recorrido, que nada del HUD de la maqueta quede
// bajo el header ni bajo los botones flotantes, y que el reel de módulos termine de cargar.
test('Inicio: 4 capítulos, HUD de la maqueta a la vista y reel cargado', async ({ page }, testInfo) => {
  const lang = (testInfo.project.metadata.lang as string | undefined) ?? 'es';
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror · ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console · ${m.text().slice(0, 200)}`);
  });
  await page.addInitScript((l) => {
    sessionStorage.setItem('mini-marie:welcome-seen', 'true');
    localStorage.setItem('mini-marie:lang', l);
  }, lang);
  await page.goto('/');
  await page.locator('[data-chapter="1"][data-done]').waitFor();
  const screens = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[data-chapter]')].map((el) => Math.round((el.offsetHeight / window.innerHeight) * 10) / 10),
  );
  expect(screens).toEqual([1, 5, 2, 3]); // 1100svh de recorrido en total

  await page.evaluate(() => document.querySelector('[data-chapter="3"]')?.scrollIntoView());
  await page.locator('[data-chapter="3"] canvas').waitFor();
  await page.waitForTimeout(500);
  const covered = await page.evaluate(() => {
    const box = (el: Element) => el.getBoundingClientRect();
    const shown = (el: Element) => getComputedStyle(el).visibility !== 'hidden' && box(el).width > 0 && box(el).height > 0;
    const floating = [...document.body.querySelectorAll('*')].filter((el) => {
      const style = getComputedStyle(el);
      return style.position === 'fixed' && style.pointerEvents !== 'none' && shown(el);
    });
    // La ficha de lugar aparece al final de la fila de abajo: una sonda de su tamaño ocupa ese sitio.
    const probe = document.createElement('div');
    probe.textContent = 'ficha de lugar';
    probe.style.cssText = 'margin-left:auto;width:20rem;height:9rem';
    document.querySelector('[data-chapter="3"] [aria-live="polite"]')?.parentElement?.append(probe);
    const hud = [...document.querySelectorAll('[data-chapter="3"] :is(.ui-panel, button, [data-mascot] .sequence)'), probe].filter(shown);
    const hits: string[] = [];
    for (const piece of hud) {
      for (const float of floating) {
        const [a, b] = [box(piece), box(float)];
        if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) {
          hits.push(`«${(piece.textContent ?? '').trim().slice(0, 30)}» bajo <${float.tagName.toLowerCase()}> ${Math.round(b.left)},${Math.round(b.top)}`);
        }
      }
    }
    probe.remove();
    return hits;
  });
  expect(covered, covered.join('\n')).toEqual([]);

  await page.evaluate(() => document.querySelector('[data-chapter="4"]')?.scrollIntoView());
  await expect(page.locator('[data-chapter="4"]')).toHaveAttribute('data-mode', /^(reel|grid)$/, { timeout: 30_000 });
  const extra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(extra, 'desborde horizontal').toBeLessThanOrEqual(0);
  expect(errors, errors.join('\n')).toEqual([]);
});
