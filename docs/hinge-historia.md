# HINGE en Historia Local

Cada tarjeta de la línea de tiempo es una superficie HINGE: llega tapada por una
cubierta de 12 piezas (4 columnas × 3 filas) con el fondo de la propia tarjeta y
su año en Anton. Al subir por la pantalla, las piezas giran en cascada diagonal
(retraso `col·0,11 + fila·0,075`), con grosor visible, se separan en profundidad
y descubren la tarjeta real. Al volver a bajarla, el giro se invierte.

El contenido nunca se dibuja en la escena: años, títulos, descripciones,
etiquetas y enlaces siguen siendo el HTML de la tarjeta, en su orden. La
cubierta es solo una capa visual (`aria-hidden`, `pointer-events: none`).

## Arquitectura

- `Timeline` decide una vez si hay WebGL 2 (`isWebGLAvailable`) y, sin
  movimiento reducido, añade `TimelineStage` dentro de cada tarjeta.
- `TimelineStage` monta el lienzo (`HingePanelCanvas`, cargado con `lazy()`) solo
  cuando la tarjeta está cerca de la pantalla y no está abierta; abierta y
  quieta, lo desmonta y libera la GPU. En la práctica hay 2–4 lienzos a la vez.
- `cardProgress`: dos estados estables, cubierta (0) y abierta (1). Se abre
  cuando el borde superior sube del 85 % del alto de la ventana y se cierra si
  baja del 95 %; entre ambos conserva el estado (sin parpadeo). Con el foco del
  teclado dentro, la tarjeta se abre.
- `spring`: resorte crítico con avance acotado (~1 s por tarjeta): varios
  gestos rápidos no aceleran la cascada.
- `panelGrid`: 12 piezas con material y textura compartidos; cada una usa su
  doceavo de UV. La cara trasera es transparente y una pieza que terminó su
  media vuelta se oculta, así la tarjeta abierta queda limpia.
- `HingeScene`: cámara en perspectiva que encuadra justo las 3 filas; colores
  leídos de la tarjeta (`background-color`, `color`), sin literales.
- Render bajo demanda (`frameloop="demand"`, `dpr` ≤ 1,75): solo mientras gira
  y con la pestaña visible; en reposo, ningún frame. Listeners pasivos.

## Accesibilidad y fallback

Sin WebGL 2, con movimiento reducido (sistema o barra de accesibilidad) o si el
renderer falla o pierde el contexto, no hay cubiertas: las tarjetas se ven
completas de inmediato. La lectura en la parte alta de la pantalla nunca está
cubierta y no hay que recorrer animaciones para llegar a la información.

## Verificación manual

- Fluidez del giro en hardware real (móvil de gama media incluido).
- Liberación real de GPU al forzar pérdida de contexto.
