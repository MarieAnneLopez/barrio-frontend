import { expect, test } from '@playwright/test';

// Galería General, cinta curva (gran actualización): lo que la revisión del carril dejó para el
// navegador. A 1440 y a 390 × 844 px: el pie de la foto centrada con su atribución y, si es de un
// lugar, «Ver en {módulo}»; Enter abre la foto en el visor con autor y licencia; con el visor abierto
// ningún botón de la cinta queda encima; y los botones a la vista se apilan por profundidad, cada uno
// con su z-index entero propio (los de fuera de pantalla quedan aparcados, sin z-index ni puntero).
const SIZES = [{ width: 1440, height: 900 }, { width: 390, height: 844 }];

test.afterEach(async ({ page }) => page.close()); // recursos (D95): cada prueba cierra su página

for (const size of SIZES) {
  test(`cinta curva a ${size.width} × ${size.height}`, async ({ page }) => {
    test.skip(test.info().project.name !== 'es-1440', 'mide sus propios anchos');
    await page.setViewportSize(size);
    await page.addInitScript(() => sessionStorage.setItem('mini-marie:welcome-seen', 'true'));
    await page.goto('/galeria');
    const hits = page.locator('button.ribbon-hit');
    await expect(hits.first()).toBeAttached({ timeout: 60_000 });
    await page.waitForTimeout(800); // el motor coloca las zonas de clic en su primer cuadro

    const z = await page.locator('button.ribbon-hit:not([data-parked])').evaluateAll((all) => all.map((el) => el.style.zIndex));
    expect(z.length).toBeGreaterThan(1);
    expect(z.every((v) => /^[1-9]\d*$/.test(v))).toBe(true);
    expect(new Set(z).size).toBe(z.length);

    const caption = page.locator('.ribbon-caption');
    await expect(caption).toBeVisible();
    await expect(caption.locator('.ribbon-caption__text')).not.toBeEmpty();
    await expect(caption).toContainText('Foto:');
    const module = caption.locator('.ribbon-module');
    if (await module.count()) await expect(module).toContainText(/^.*Ver en /);

    await page.locator('button.ribbon-hit[tabindex="0"]').focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Foto:');
    const onTop = await page.evaluate(() =>
      [[0.5, 0.5], [0.2, 0.5], [0.8, 0.5]].map(([x = 0, y = 0]) =>
        Boolean(document.elementFromPoint(innerWidth * x, innerHeight * y)?.closest('button.ribbon-hit'))),
    );
    expect(onTop).toEqual([false, false, false]);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });
}
