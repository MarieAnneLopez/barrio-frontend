# CONTRACTS — HINGE en Historia Local (`/historia`) · ronda 2026-11-23
Raíz del repo = `barrio-frontend/` (repo propio). Base: `main` @ 59b4cad (= origin/main = interfaz-elegante).

## 0. Reglas de orquesta (todos los nodos)
- AUTOCOMPACTA tu conversación al llegar al 50 % de tu ventana de contexto.
- No uses la herramienta nativa `Task` para trabajo pesado. `subagente.ps1` en RESERVA: no se invoca en esta ronda.
- Sin dependencias npm nuevas (ni dev). Sin borrar/mover archivos. Sin refactors, secciones, galerías, videos ni textos nuevos.
- Regla del repo: ningún archivo `.ts/.tsx/.css` supera 100 líneas (`npm run check:lines`). Divide en módulos.
- Sin colores literales (hex/rgb/hsl/nombres) en código nuevo: lee tokens CSS con `getComputedStyle`.
- Ante dependencia nueva, archivo fuera de tu frontera o cambio de firma: DETENTE y repórtalo en tu commit.

## 1. Memoria (Segundo Cerebro)
- No consultado: el código local bastó. No hay decisiones previas que repetir. Ningún worker escribe memoria.
- maquetador: SIN ACCESO. programador/gemini: SOLO LECTURA condicional (buscar.py / graphify query), prohibido escribir/actualizar grafo o leer HTML.

## 2. Stack real (auditado)
- three 0.172.0 · @types/three 0.172.0 · @react-three/fiber 8.18.0 + drei 9.122.0 instalados y ya usados en `src/three/` → HINGE usa R3F (`frameloop="demand"` + `invalidate()`); drei solo si evita código propio. Referencia de solo lectura: `src/three/contextRecovery.ts`, `src/three/TintalScene.tsx`.
- React 18.3 · TS 6 strict (`exactOptionalPropertyTypes`, `noUnused*`, `noUncheckedIndexedAccess`) · Vite 8 · Tailwind 4 (utilidades inline, sin CSS por componente).
- Tests: Vitest 5 + jsdom + Testing Library; include `src/**/*.test.{ts,tsx}`; setup `src/test/setup.ts`. En jsdom `getContext` devuelve null.
- Scripts: `npm run typecheck` · `npm run lint` (`--max-warnings 0`) · `npm test` · `npm run check:lines` · `npm run build`.
- Ruta `/historia` → `src/app/routes.tsx` → `HistoryPage` → `<Timeline hitos fuentes />`.
- `Hito` (`src/lib/apiTypes.ts`): `{ id, anio:number, orden, titulo, descripcion, source_ref, verified }`. SIN imagen → todas las caras usan CanvasTexture.
- Movimiento reducido: `useReducedMotion()` (`src/hooks/useReducedMotion.ts`) = barra a11y (`a11yStore.reducedMotion`) || `prefers-reduced-motion: reduce`. Ya se usa en `Timeline.tsx`.
- Fixtures reales de test: `src/test/historyFixtures.ts` (`HISTORIA`), `src/test/renderRoute.tsx`, `src/test/mockApi.ts`.

## 3. Frontera de archivos (exclusiva)
- programador: `src/features/history/hinge/**` (existen stubs: `types.ts`, `hingeMath.ts`, `renderPolicy.ts`, `webglSupport.ts`, `HingePanelCanvas.tsx`; puede añadir módulos dentro de `hinge/`).
- maquetador: `src/features/history/Timeline.tsx` + nuevos `TimelineStage.tsx`, `TimelineNav.tsx`, `useActiveHito.ts` (mismo directorio). `HistoryPage.tsx`: 0 líneas (no hace falta: Timeline ya lee `useReducedMotion`).
- gemini: `src/features/history/__tests__/**` + `docs/hinge-historia.md`.
- Nadie toca: `src/i18n/**`, tests existentes (`history/*.test.ts(x)`), `README.md`, otros features, `package*.json`.

## 4. Firmas públicas congeladas (`src/features/history/hinge/`)
- `types.ts`: `HingeFace { imageSrc?: string; year: string }` · `HingePanelCanvasProps { activeIndex: number; faces: ReadonlyArray<HingeFace>; reducedMotion: boolean; onUnavailable: () => void; className?: string }` · `HingePanelState { rotX; rotY; posZ; outward }` · `RenderInput { animating; hoverDirty; hidden; inViewport }` (todos `boolean`/`number`).
- `hingeMath.ts`: `HINGE_COLS = 4` · `HINGE_ROWS = 3` · `hingePanelState(fraccion: number, col: number, row: number): HingePanelState`.
- `renderPolicy.ts`: `shouldRender(input: RenderInput): boolean`.
- `webglSupport.ts`: `isWebGLAvailable(): boolean`.
- `HingePanelCanvas.tsx`: `export default` componente `(props: HingePanelCanvasProps)`; renderiza R3F `<Canvas aria-hidden="true" className={className} frameloop="demand" dpr={[1, 1.75]} gl={{ alpha: true }}>`. Se carga con `lazy()`: no entra en el chunk inicial.

## 5. Matemática HINGE (exacta; col 0 = izquierda, row 0 = fila superior)
- `retraso = col*0.11 + row*0.075` · `local = clamp(fraccion*1.48 − retraso, 0, 1)` · `suavizado = local²(3 − 2·local)` · `arco = sin(π·suavizado)`
- `rotY = π·suavizado` · `rotX = arco·(row−1)·0.12` · `posZ = arco·(0.65 + row·0.12)` · `outward = arco·0.12`
- Desplazamiento XY = `(centroPanel − centroGrid)·outward` en unidades de panel. En fraccion 0 y 1 la superficie es plana y continua.
- Progreso `p ∈ [0, n−1]` continuo persigue `activeIndex` (resorte crítico, dt ≤ 1/30 s, velocidad acotada). `fraccion = p − floor(p)`; frontal = hito `floor(p)`, trasera = `floor(p)+1`. Avanzar/retroceder: misma función. `reducedMotion` → `p = activeIndex` inmediato, sin hover.

## 6. Escena
- Panel = 1×1 unidad (alto de panel), grosor 0.08; grid 4×3 → relación 4:3. Cámara encuadra el grid al contenedor sin deformar; `ResizeObserver`.
- Textura por cara (nunca 12 copias); cada panel usa su 1/12 de UV; UV trasera espejada en U. Geometría/material compartidos donde se pueda.
- Cara sin imagen: CanvasTexture con fondo `--bg-surface` y año en Anton (`--text-primary`); esperar `document.fonts` antes de dibujar. Cantos `--border-strong`.
- `alpha: true`, sin fondo oscuro. Pixel ratio = `min(devicePixelRatio || 1, 1.75)` (`dpr`). Hover solo con `(hover: hover) and (pointer: fine)` y sin reducedMotion.
- Render bajo demanda: `shouldRender` = (animating || hoverDirty) && !hidden && inViewport (IntersectionObserver + visibilitychange). Solo se llama `invalidate()` si `shouldRender` es true. En reposo: ningún frame.
- `webglcontextlost` o error de renderer → `onUnavailable()` + liberar todo. Desmontaje: dispose de geometrías, materiales, texturas, renderer, observers y listeners.

## 7. Integración en Timeline (maquetador)
- `Timeline({ hitos, fuentes })` conserva firma. `<ol>` actual intacto (ref de `useScrollReveal`, `data-reveal`, clases, tonos, badges, `SourceLinks`).
- Activo: índice inicial 0; `<li aria-current="step">` solo en el activo.
- Escenario: `<div data-hinge-stage aria-hidden="true" class="relative aspect-[4/3] w-full max-w-3xl">` con `<Suspense fallback={null}><HingePanelCanvas className="absolute inset-0 size-full" …/></Suspense>` ANTES del `<ol>`; `const HingePanelCanvas = lazy(() => import('./hinge/HingePanelCanvas'))`.
- `faces = hitos.map(h => ({ year: String(h.anio) }))`; `reducedMotion = useReducedMotion()`.
- Navegación: `<div role="group" data-hinge-nav aria-label=…>` con botones `hinge-nav__btn` (≥ 44×44 px: `min-h-11 min-w-11`), `aria-label` «Hito anterior» / «Hito siguiente», `disabled` en extremos (si el botón con foco se deshabilita, el foco pasa al otro), estado «Hito N de M» en `aria-live="polite"`. ←/→ solo vía `onKeyDown` del grupo; nunca listeners en `window`.
- i18n: claves `history.hinge.nav|prev|next|position` con `t(key, { defaultValue })` en español (no se tocan los JSON).
- Fallback: si `isWebGLAvailable()` es falso al montar → ni escenario ni navegación (igual que hoy). Si `onUnavailable` llega después → desmonta el canvas, conserva la caja (sin salto de layout) y la navegación.
- Prohibido `touch-action: none` y `preventDefault` en wheel/touchmove. Sin overflow horizontal.

## 8. Invariantes de contenido
- 100 % de años, títulos, descripciones, etiquetas «Prensa»/«Por verificar», enlaces de fuentes y orden. Hermanos intactos: bandera, indicadores, ubicación, fuentes.
- Tipografía, paleta, fondos y espaciados actuales. Cero `FORME`, `TIDAL`, `INDEX`, `MORPH`, `MAISON`, `VERDANT`. Sin texto duplicado en el árbol accesible.
