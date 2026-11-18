import { expect, test } from '@playwright/test';

// Gran actualización: las 8 asomadas de la bienvenida quedan FIJAS en las esquinas exactas y en el
// centro de cada borde de la pantalla visible. A 390, 768, 1440 y 1920 px, el centro de lo que se
// ve de cada una queda a ≤ 12 px de donde debe estar (la cuenta pura de welcomePeeks.visibleBox).
const SIZES = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];
const ROTATION: Record<string, number> = { tl: 135, top: 180, tr: -135, right: -90, br: -45, bottom: 0, bl: 45, left: 90 };

test.describe('bienvenida: 8 asomadas fijas', () => {
  for (const size of SIZES) {
    test(`a ${size.width} × ${size.height}`, async ({ page }) => {
      test.skip(test.info().project.name !== 'es-1440', 'mide sus propios anchos');
      await page.setViewportSize(size);
      await page.goto('/historia');
      const dialog = page.getByRole('dialog', { name: /Hola/ });
      await expect(dialog).toBeVisible({ timeout: 60_000 });
      await page.waitForTimeout(1200); // termina la entrada (0,7 s + desfases)
      const result = await page.evaluate((rotation) => {
        const view = { w: window.visualViewport?.width ?? innerWidth, h: window.visualViewport?.height ?? innerHeight };
        const bodies = [...document.querySelectorAll<HTMLElement>('.welcome-peek')];
        return bodies.map((peek) => {
          const slot = peek.dataset.slot ?? '';
          const body = peek.querySelector<HTMLElement>('.welcome-peek__body') as HTMLElement;
          const r = body.getBoundingClientRect();
          const box = { l: Math.max(0, r.left), r: Math.min(view.w, r.right), t: Math.max(0, r.top), b: Math.min(view.h, r.bottom) };
          const seen = { x: (box.l + box.r) / 2, y: (box.t + box.b) / 2 };
          // La cuenta pura: lo que asoma (46 % de arriba) girado sobre el ancla exacta.
          const ax = slot.endsWith('l') || slot === 'left' ? 0 : slot.endsWith('r') || slot === 'right' ? view.w : view.w / 2;
          const ay = slot.startsWith('t') ? 0 : slot.startsWith('b') ? view.h : view.h / 2;
          const rad = ((rotation[slot] ?? 0) * Math.PI) / 180;
          const [w, v] = [body.offsetWidth, body.offsetHeight * 0.46];
          const pts = [[-w / 2, -v], [w / 2, -v], [-w / 2, 0], [w / 2, 0]].map(([x = 0, y = 0]) =>
            [ax + x * Math.cos(rad) - y * Math.sin(rad), ay + x * Math.sin(rad) + y * Math.cos(rad)]);
          const xs = pts.map((p) => p[0] ?? 0);
          const ys = pts.map((p) => p[1] ?? 0);
          const want = {
            x: (Math.max(0, Math.min(...xs)) + Math.min(view.w, Math.max(...xs))) / 2,
            y: (Math.max(0, Math.min(...ys)) + Math.min(view.h, Math.max(...ys))) / 2,
          };
          return { slot, off: Math.hypot(seen.x - want.x, seen.y - want.y), visible: box.r > box.l && box.b > box.t };
        });
      }, ROTATION);
      console.log(size.width, JSON.stringify(result.map((p) => [p.slot, +p.off.toFixed(1)])));
      expect(result).toHaveLength(8);
      for (const peek of result) {
        expect(peek.visible, peek.slot).toBe(true);
        expect(peek.off, peek.slot).toBeLessThanOrEqual(12);
      }
      await page.screenshot({ path: `test-results/bienvenida-${size.width}.png` });
    });
  }
});
