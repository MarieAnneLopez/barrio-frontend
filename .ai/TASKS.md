# TASKS — HINGE en Historia Local · ronda 2026-11-23

Todos: autocompacta tu conversación al llegar al 50 % de tu ventana de contexto. Lee primero `.ai/CONTRACTS.md`.
Ningún bloque comparte archivos. Si un bloque necesita algo de otro, se anota en el commit y se resuelve en `/integrar`.
Cierre de cada worker: `npm run typecheck`, `npm run lint`, `npm run check:lines` y la suite que te toque; `git commit` en tu rama `agent/<rol>` con lo verificado y lo pendiente.
`subagente.ps1`: en RESERVA (bono API hasta 8 dic 2026). Ningún worker lo invoca; si fuera indispensable, alias `sonnet` (o `opus` solo crítico), nunca IDs fijos, y solo el Director.

## Bloque A — `maquetador` (rama `agent/maquetador`) · memoria: SIN ACCESO
Archivos exclusivos: `src/features/history/Timeline.tsx`, `TimelineStage.tsx`, `TimelineNav.tsx`, `useActiveHito.ts` (nuevos, mismo directorio).
- [ ] `useActiveHito(total)`: índice activo (inicial 0), `prev`, `next`, límites; sin listeners globales.
- [ ] `TimelineStage`: caja 4:3 `data-hinge-stage aria-hidden="true"`, `lazy()` + `Suspense` del canvas, manejo de `onUnavailable` (conserva la caja).
- [ ] `TimelineNav`: grupo `role="group"` `data-hinge-nav`, botones `hinge-nav__btn` ≥ 44×44 px, `disabled` en extremos con traspaso de foco, «Hito N de M» en `aria-live="polite"`, ←/→ por `onKeyDown` del grupo.
- [ ] `Timeline`: monta escenario + navegación solo si `isWebGLAvailable()` al montar; `aria-current="step"` en el `<li>` activo; el `<ol>` actual sin cambios de contenido, clases ni orden.
- [ ] Etiquetas con `t('history.hinge.<clave>', { defaultValue: '…' })`; NO editar `src/i18n/*.json` (pendiente de aprobación de Martín en `/integrar`).
- [ ] Tests existentes de `src/features/history/*.test.*` siguen en verde sin editarlos (`npx vitest run src/features/history`).
- Pendiente de `/integrar`: efecto real del canvas (aquí el stub devuelve null y `isWebGLAvailable()` es false).

## Bloque B — `programador` (rama `agent/programador`) · memoria: SOLO LECTURA condicional
Archivos exclusivos: `src/features/history/hinge/**`.
- [ ] `hingeMath.ts`: matemática exacta de CONTRACTS §5, pura y determinista.
- [ ] Resorte del progreso `p` (módulo propio en `hinge/`): crítico, dt ≤ 1/30 s, velocidad acotada; `reducedMotion` → salto inmediato.
- [ ] `renderPolicy.ts`: `shouldRender` puro (CONTRACTS §6).
- [ ] `webglSupport.ts`: `try/catch` sobre `getContext('webgl2') || getContext('webgl')`.
- [ ] Escena R3F de 12 paneles con grosor, UV por panel, trasera espejada, texturas CanvasTexture con tokens CSS, cantos `--border-strong`, cámara que encuadra sin deformar.
- [ ] Hover con raycast solo en `(hover: hover) and (pointer: fine)` y sin reducedMotion.
- [ ] `webglcontextlost` / error → `onUnavailable()`; dispose completo al desmontar.
- [ ] Ningún archivo > 100 líneas; firmas de CONTRACTS §4 exactas.
- No verificable sin navegador: fluidez, liberación real de GPU, aspecto visual. Decláralo en el commit.

## Bloque C — `gemini` (rama `agent/gemini`) · memoria: SOLO LECTURA condicional, máx. 1 subagente interno
Archivos exclusivos: `src/features/history/__tests__/**`, `docs/hinge-historia.md`.
- [ ] `__tests__/hingeMath.test.ts`: anclas y propiedades (`toBeCloseTo(v, 5)`).
- [ ] `__tests__/renderPolicy.test.ts`: tabla de verdad completa (16 combinaciones).
- [ ] `__tests__/TimelineHinge.test.tsx`: datos de `src/test/historyFixtures.ts`; `vi.mock` de `../hinge/webglSupport` (true/false) y de `../hinge/HingePanelCanvas` (espía de props) dentro del propio test.
- [ ] `docs/hinge-historia.md` (≤ 60 líneas) con lista «Verificación manual en `/integrar`».
- [ ] Commit con resultado real por suite: «falla por STUB (esperado)» vs «falla real».

## Integración (Director, `/integrar`)
- Orden de merge: programador → maquetador → gemini. Luego `npm test`, typecheck, lint, check:lines, build.
- Decisiones pendientes de Martín: claves i18n en `es.json`/`en.json`; destino del push (el `origin` actual es `MarieAnneLopez/barrio-frontend`).
