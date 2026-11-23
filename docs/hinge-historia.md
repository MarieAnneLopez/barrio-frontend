# HINGE en Historia Local

`Timeline` mantiene la lista semántica de hitos y añade progresivamente una
escena HINGE decorativa. El escenario no duplica contenido: sus caras se
derivan de los años de los mismos hitos y queda fuera del árbol accesible.

## Arquitectura

`Timeline` decide si WebGL está disponible y, entonces, monta `TimelineStage`,
el canvas cargado con `lazy()` y `TimelineNav`. La lista existente continúa
siendo la fuente de contenido y el indicador de hito activo (`aria-current`).

`HingePanelCanvas` recibe:

- `activeIndex`: hito hacia el cual persigue el giro.
- `faces`: años para las caras de panel; una por hito.
- `reducedMotion`: salta al índice activo, sin animación ni hover.
- `onUnavailable`: desmonta la escena si falla WebGL sin retirar su caja.
- `className`: permite que el canvas ocupe la caja 4:3.

La matemática HINGE es pura (`hingePanelState`) y la política de dibujo también
(`shouldRender`). Esta última permite un frame solo con animación o hover
pendiente, documento visible y escenario dentro del viewport.

## Accesibilidad y fallback

El escenario tiene `aria-hidden="true"`; la lista conserva años, títulos,
descripciones, etiquetas y enlaces. La navegación es un grupo con botones de
44 × 44 px como mínimo, etiquetas accesibles, estado en vivo y flechas solo
cuando el grupo tiene foco. Los extremos se deshabilitan y el activo se anuncia
en el `<li>` correspondiente.

Si WebGL no está disponible, no se muestra escenario ni navegación: la línea de
tiempo completa y todos sus enlaces permanecen operativos. Si el renderer falla
después de montarse, se libera y se conserva la caja para evitar un salto visual.

## Verificación manual en `/integrar`

- Confirmar en navegador que los botones miden al menos 44 × 44 px reales.
- Comprobar ausencia de scroll horizontal a 375 px y a 1440 px.
- Forzar pérdida de contexto y confirmar la liberación real de GPU.
- Evaluar la fluidez del giro, hover y retorno al reposo en hardware real.
