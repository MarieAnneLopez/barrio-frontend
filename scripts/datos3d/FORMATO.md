# Formato TNT3 de los datos 3D de El Tintal (versión 1)

Especificación byte a byte de `public/data/tintal/` para quien dibuja la maqueta. El decodificador de
referencia está en `src/three/data/` (Web Worker incluido) y el codificador en `scripts/datos3d/`
(`encode.mjs` + `layouts.mjs`). Los códigos numéricos de clases y banderas están en
`src/three/data/tnt3.json`, que leen los dos lados: esta tabla y ese JSON deben decir lo mismo.

## 1. Archivos

| Archivo | Tipo TNT3 | Contenido |
|---|---|---|
| `manifest.json` | — | versión, proyección, tamaño y sha256 de cada archivo, conteos, fuentes y licencias |
| `edificios.bin.gz` | 1 | huellas de edificios, pisos, dirección, nombre, lote y sector |
| `vias.bin.gz` | 2 | red vial y peatonal (grafo), cruces peatonales y semáforos |
| `suelo.bin.gz` | 3 | límite del barrio, parques, pasto, agua y líneas de agua |
| `puntos.bin.gz` | 4 | árboles, hileras de árboles y faroles |

Cada `.bin.gz` es un archivo TNT3 comprimido con gzip (RFC 1952, sin fecha, SO = 255). Si el
servidor lo entrega ya descomprimido (`Content-Encoding: gzip`), los dos primeros bytes no son
`1f 8b` sino `TNT3`: el decodificador acepta ambos casos. El manifiesto da `bytes` (comprimido),
`bytesTnt3` (descomprimido; el decodificador lo exige) y `sha256` (del comprimido; el cliente lo usa
como `?v=` para no mezclar archivos de versiones distintas en la caché).

## 2. Contenedor TNT3 (todo little-endian)

| Desplazamiento | Bytes | Campo |
|---|---|---|
| 0 | 4 | firma ASCII `TNT3` (`54 4E 54 33`) |
| 4 | 2 | versión, u16 = `1` |
| 6 | 2 | tipo de archivo, u16 (tabla de arriba) |
| 8 | 4 | número de secciones S, u32 |
| 12 | 16 × S | tabla de secciones |
| … | | bloques de datos |

Cada entrada de la tabla de secciones (16 bytes):

| Desplazamiento | Bytes | Campo |
|---|---|---|
| 0 | 4 | id ASCII (`A-Z`, `0-9`), relleno con espacios a la derecha: `XZ` se guarda `XZ␠␠` |
| 4 | 1 | tipo: 1 u8, 2 i8, 3 u16, 4 i16, 5 u32, 6 i32, 7 f32, 8 f64, 9 utf8 |
| 5 | 3 | reservado, ceros |
| 8 | 4 | desplazamiento del bloque desde el byte 0 del archivo, u32, múltiplo de 8 |
| 12 | 4 | largo: número de elementos (tipos 1-8) o de bytes (tipo 9) |

Los bloques empiezan en múltiplos de 8 y se rellenan con ceros; el archivo completo también mide un
múltiplo de 8. Así cada bloque se puede leer como arreglo tipado sin copiar. Las secciones se buscan
por id (el orden de la tabla no importa); una sección vacía tiene largo 0.

**Tablas de texto (tipo 9).** UTF-8; cada texto termina en un byte `00`. El texto de índice 0 es
siempre `""` y significa «sin dato»; las columnas que apuntan a una tabla usan ese 0 para «no hay».

**Coordenadas.** Proyección local equirectangular idéntica a `src/three/projection.ts`:
`createProjection(manifest.proyeccion.bbox)`, con origen en el centro del bbox del polígono del
barrio (`manifest.proyeccion.origen`), x hacia el este y z hacia el sur (el norte es −z), en metros.
Se guardan en **int16 de decímetros** (`unidadesPorMetro` = 10; ±3276,7 m alrededor del origen) y
**en deltas por secuencia**: el primer vértice de cada secuencia es absoluto y cada siguiente es la
diferencia con el anterior, con vuelta en 16 bits. Decodificar (pseudocódigo):

```text
para cada secuencia s (vértices inicio[s] .. inicio[s+1]-1):
  x = 0; z = 0
  para cada vértice v: x = int16(x + XZ[2v]); z = int16(z + XZ[2v+1])
                       metros = (x / 10, z / 10)
```

Una «secuencia» es un anillo (polígonos), una línea (líneas) o la lista completa (nodos y puntos).
Los anillos van **abiertos** (el último vértice no repite el primero); el exterior gira antihorario
visto desde arriba con el norte arriba (área positiva en el plano x, −z) y los huecos, horario.

## 3. `edificios.bin.gz` (tipo 1) — N edificios, R anillos, V vértices

| Id | Tipo | Largo | Significado (campo del decodificador) |
|---|---|---|---|
| `XZ` | i16 | 2V | vértices, deltas por anillo (`xz`, Float32 en metros) |
| `ANIL` | u32 | R+1 | inicio de cada anillo en vértices; el último = V (`anillos`) |
| `EDIF` | u32 | N+1 | inicio de cada edificio en anillos; su primer anillo es el exterior, los demás huecos (`edificios`) |
| `PISO` | u8 | N | pisos del volumen (`pisos`) |
| `BASE` | u8 | N | piso donde empieza el volumen: 0 en el suelo, ≥ 1 en voladizos (`base`) |
| `SOTA` | u8 | N | sótanos (`sotanos`) |
| `BAND` | u8 | N | banderas, abajo (`banderas`) |
| `DIRT` | u8 | N | de dónde salió la placa: 0 ninguna, 1 dentro de la huella, 2 la más cercana de su lote, 3 la más cercana de su manzana; la ficha debe decirlo (abajo) (`tipoDireccion`) |
| `DIRE` | u32 | N | índice en `TDIR` (`direccion`) |
| `NOMT` | u8 | N | 0 sin nombre, 1 nombre de un edificio OSM que lo contiene, 2 del área con nombre más pequeña que lo contiene (`tipoNombre`) |
| `NOMB` | u32 | N | índice en `TNOM` y `TNRF` (`nombre`) |
| `LOTE` | u32 | N | índice en `TLOT` (`lote`) |
| `SECT` | u32 | N | índice en `TSEC` (`sector`) |
| `OSMI` | f64 | N | id OSM del edificio: > 0 vía, < 0 relación, 0 si es de Catastro (`osm`) |
| `TDIR` | utf8 | | texto de la placa oficial, p. ej. `KR 88D # 6D-27 TO 6`, o la dirección del conjunto sin casa ni torre, `KR 88D # 6D-27` (abajo) (`textos.direcciones`) |
| `TNOM` | utf8 | | nombres de conjunto o lugar (`textos.nombres`) |
| `TNRF` | utf8 | | origen de cada nombre, paralela a `TNOM`: `way/123`, `relation/456` (`textos.origenNombres`) |
| `TLOT` | utf8 | | códigos de lote catastral de 12 dígitos (`textos.lotes`) |
| `TSEC` | utf8 | | nombres de sector catastral, p. ej. `CALANDAIMA` (`textos.sectores`) |

Banderas (`BAND`): 1 `osm` (viene de OSM porque falta en Catastro), 2 `pisosConocidos` (los pisos
son dato de la fuente), 4 `voladizo`, 8 `mejora`, 16 `semisotano`, 32 `subterranea` (0 pisos sobre
el suelo: no asoma), 64 `enConstruccion` (OSM building=construction).

**Volumen.** De `base × h` a `(base + pisos) × h`, con `h` la altura por piso que use la escena
(hoy `METERS_PER_LEVEL` = 3,2 m × `EXAGGERATION`). Catastro publica pisos, no metros. Si
`pisosConocidos` falta (12 de los 13 edificios de OSM), los pisos son **sin dato**: el renderizador
puede darles una altura por regla, pero la ficha debe decir «pisos sin dato», nunca un número.
Las construcciones `subterranea` no tienen volumen visible.

**Ficha.** Nombre (`NOMT` > 0) o, si no hay, la dirección; junto a la dirección, siempre lo que
dice `DIRT`, porque solo con 1 la placa está en el propio edificio:

| `DIRT` | De dónde sale la dirección | La ficha la presenta como |
|---|---|---|
| 1 | una placa oficial de su lote cae dentro de la huella | «Dirección oficial» |
| 2 | la placa oficial más cercana de su mismo lote (la relación es por cercanía) | «Dirección de su lote (placa más cercana)» |
| 3 | la placa más cercana de otro lote de su manzana | «Dirección aproximada (de la manzana)» |
| 0 | no hay placa en su lote ni en su manzana | «Sin dirección» |

El número de casa, torre o interior (`CA 5`, `TO 6`, `IN 3`, `MJ`) solo acompaña al edificio al
que identifica: con `DIRT` 1, si es el único interior que cae en la huella; con 2, si este edificio
es el del lote más cercano a esa placa y está a menos de 5 m. Si no (una huella con varias casas,
una placa que es de otro edificio o que queda lejos) y siempre con 3, el texto es la dirección del
conjunto: vía y número, sin interior (`KR 88D # 6D-27`). Por eso muchos edificios de un mismo
conjunto comparten la dirección (el lote 004627077011 tiene 744 construcciones y una sola placa).

Además lote (`TLOT`), sector (`TSEC`) y fuente: Catastro (UAECD) o OSM. Origen trazable: Catastro →
`https://datosabiertos.bogota.gov.co/dataset/construccion#LOTECODIGO=<lote>`; OSM →
`https://www.openstreetmap.org/way/<id>` (o `relation/<-id>`). Los textos son datos reales
(`verified`) de Catastro y OSM, pero la relación entre la placa y el edificio solo es directa con
`DIRT` = 1: con 2 y 3 es una aproximación, y la ficha no la muestra como la placa verificada del
edificio.

## 4. `vias.bin.gz` (tipo 2) — M nodos, W tramos, C cruces, S semáforos

| Id | Tipo | Largo | Significado |
|---|---|---|---|
| `NODO` | i16 | 2M | nodos únicos, una sola secuencia de deltas (`nodos`) |
| `TRAM` | u32 | W+1 | inicio de cada tramo en `INDI` (`tramos`) |
| `INDI` | u32 | K | índices de nodo de cada tramo, en el orden del dibujo de OSM (`indices`) |
| `CLAS` | u8 | W | clase (`clase`), abajo |
| `SENT` | i8 | W | 1 sentido único a favor del dibujo, −1 en contra, 0 doble sentido (`sentido`) |
| `CARR` | u8 | W | carriles (`lanes`); 0 sin dato (`carriles`) |
| `VMAX` | u8 | W | velocidad máxima km/h; 0 sin dato (`vmax`) |
| `NIVE` | i8 | W | `layer` de OSM (puentes 1, deprimidos −1); 0 por defecto (`nivel`) |
| `BAND` | u8 | W | banderas (`banderas`), abajo |
| `NOMB` | u32 | W | índice en `TNOM` (`nombre`) |
| `OSMI` | f64 | W | id de la vía OSM (`osm`) |
| `TNOM` | utf8 | | nombres de vías (`textos.nombres`) |
| `CRXZ` | i16 | 2C | centro de cada cruce peatonal, una secuencia (`cruces.xz`) |
| `CRTI` | u8 | C | tipo de cruce (`cruces.tipo`), abajo |
| `CRAN` | u16 | C | eje de la calle en diezmilésimas de radián: `atan2(dz, dx)` en [0, π) (`cruces.angulo`, en rad) |
| `CRLA` | u16 | C | largo del cruce en decímetros; 0 sin dato (`cruces.largo`, en m) |
| `CROS` | f64 | C | id OSM: del nodo, o de la vía si `deVia` (`cruces.osm`) |
| `SEXZ` | i16 | 2S | semáforos (`highway=traffic_signals`), una secuencia (`semaforos.xz`) |
| `SEOS` | f64 | S | id del nodo OSM (`semaforos.osm`) |

Clases (`CLAS`, de `highway`): vehiculares 1 motorway, 2 trunk, 3 primary, 4 secondary,
5 tertiary, 6 unclassified, 7 residential, 8 living_street, 9 service, 10 busway, 11 road,
12 construction (en obra); peatonales y de bici 20 footway, 21 sidewalk (`footway=sidewalk`),
22 crossing (`footway=crossing`), 23 path, 24 pedestrian, 25 steps, 26 cycleway, 27 track,
28 corridor, 29 bridleway. Los `*_link` toman la clase de su vía con la bandera `enlace`. No entra
lo que no existe en el terreno (`proposed`, `abandoned`, `platform`…).

Banderas (`BAND`): 1 `enlace`, 2 `puente`, 4 `tunel`, 8 `accesoRestringido` (`access`,
`motor_vehicle` o `vehicle` = no/private), 16 `glorieta`, 32 `area` (`area=yes`: plaza cerrada, no
línea), 64 `soloBus`, 128 `recortada` (el tramo termina en el borde del barrio: es un corte, no un
fin de calle).

**Grafo.** Dos tramos que comparten un índice de nodo se tocan ahí (nodo OSM común). Regla
sugerida para carros: clase 1-11 sin `soloBus`, respetando `SENT`; `accesoRestringido` son vías
internas de conjuntos (pueden quedar sin carros o con pocos); en un extremo `recortada`, los carros
entran o salen de la escena. Personitas: clases 20-27 y, si hace falta, el borde de las calles
residenciales y de servicio (OSM mapea pocos andenes aparte: ese borde es una regla de dibujo, no
un dato).

Cruces: los nodos `highway=crossing`, los semáforos que también son cruce
(`highway=traffic_signals` + `crossing=*`; van además en `SEXZ`) y las vías de cruce
(`footway`, `cycleway` o `path` = `crossing`) que no tienen un nodo de cruce. Las vías
`cycleway=crossing` y `path=crossing` siguen en el grafo con su clase (26, 23); solo
`footway=crossing` es la clase 22.

Tipo de cruce (`CRTI`): bits 0-1 marcas (0 sin dato, 1 cebra, 2 marcado sin patrón dicho,
3 sin marcas), 4 `semaforo`, 8 `deVia` (posición y eje deducidos de una vía de cruce sin nodo de
cruce: su punto medio), 16 `sinEje` (no hay vía que dé el eje; `CRAN` = 0), 32 `ciclorruta` (el
cruce es de una vía `cycleway=crossing`: de la ciclorruta; OSM no siempre dice si también es
peatonal). Con
`rotation.y = -angulo`, el +x local de un objeto queda a lo largo de la calle (en three,
`rotation.y = φ` lleva +x a (cos φ, 0, −sen φ)): la franja del cruce mide `largo` en z local, de
andén a andén (si es 0, el ancho de la calzada), y unos 3-4 m en x; las barras de la cebra van a
lo largo de x y se repiten en z.

## 5. `suelo.bin.gz` (tipo 3) — A áreas, L líneas

| Id | Tipo | Largo | Significado |
|---|---|---|---|
| `XZ` | i16 | | vértices de las áreas, deltas por anillo (`xz`) |
| `ANIL` | u32 | R+1 | inicio de cada anillo (`anillos`) |
| `AREA` | u32 | A+1 | inicio de cada área en anillos; el primero es el exterior (`areas`) |
| `CLAS` | u8 | A | clase de suelo (`clase`); el área 0 es el barrio (clase 1) |
| `NOMB` | u32 | A | índice en `TNOM` (`nombre`) |
| `OSMI` | f64 | A | id OSM (> 0 vía, < 0 relación, 0 el barrio) (`osm`) |
| `LXZ` | i16 | | vértices de las líneas de agua, deltas por línea (`lineas.xz`) |
| `LINE` | u32 | L+1 | inicio de cada línea (`lineas.inicios`) |
| `LCLA` | u8 | L | 1 canal, 2 río, 3 quebrada, 4 drenaje, 5 zanja (`lineas.clase`) |
| `LNOM` | u32 | L | índice en `TNOM` (`lineas.nombre`) |
| `LOSM` | f64 | L | id de la vía OSM (`lineas.osm`) |
| `TNOM` | utf8 | | nombres de áreas y líneas (`textos.nombres`) |

Clases de suelo: 1 barrio, 2 park, 3 garden, 4 playground, 5 pitch, 6 track, 7 sports_centre,
8 grass, 9 recreation_ground, 10 village_green, 11 meadow, 12 forest, 13 wood, 14 scrub,
15 grassland, 16 water, 17 wetland, 18 basin, 19 riverbank. Las áreas vienen recortadas al barrio
(como el ETL del backend), así que una misma área OSM puede salir en varias partes.

## 6. `puntos.bin.gz` (tipo 4) — T árboles, H hileras, F faroles

| Id | Tipo | Largo | Significado |
|---|---|---|---|
| `ARXZ` | i16 | 2T | árboles reales (`natural=tree`), una secuencia (`arboles.xz`) |
| `AROS` | f64 | T | id del nodo OSM (`arboles.osm`) |
| `HIXZ` | i16 | | hileras de árboles (`natural=tree_row`), deltas por línea (`hileras.xz`) |
| `HILE` | u32 | H+1 | inicio de cada hilera (`hileras.inicios`) |
| `HIOS` | f64 | H | id de la vía OSM (`hileras.osm`) |
| `FAXZ` | i16 | 2F | faroles reales (`highway=street_lamp`) (`faroles.xz`) |
| `FAOS` | f64 | F | id del nodo OSM (`faroles.osm`) |

Hoy OSM tiene 248 árboles sueltos y 20 hileras en el barrio, y **ningún farol** (`F` = 0). Las
hileras son reales, pero no la posición de cada árbol: el renderizador puede repartirlos a lo
largo de la línea (p. ej. cada 6-8 m). Si la escena quiere faroles o más árboles, puede
**distribuirlos como decoración por una regla** (p. ej. faroles cada 25-30 m a lo largo de
andenes y calles principales, alternando lados; árboles dentro de parques y pasto), siempre como
adorno: nunca se cuentan ni se muestran en una ficha como dato real.

## 7. Uso desde la escena

```ts
import { loadTintal3DInWorker } from './data/tintal3dClient';
import { createProjection } from './projection';

const data = await loadTintal3DInWorker(); // Web Worker; una sola carga por sesión
const project = createProjection(data.manifest.proyeccion.bbox); // la misma de los datos
const e = data.edificios;
for (let b = 0; b < e.count; b++) {
  const rings = [];
  for (let r = e.edificios[b]; r < e.edificios[b + 1]; r++) rings.push(e.xz.subarray(2 * e.anillos[r], 2 * e.anillos[r + 1]));
  // rings[0] exterior, el resto huecos; x/z ya en metros; volumen de base a base + pisos
}
```

## 8. Licencias y atribución

Catastro Bogotá (UAECD): «Creative Commons Attribution 4.0». OpenStreetMap: ODbL 1.0 («©
OpenStreetMap contributors»). Lo derivado de OSM es una base de datos derivada bajo ODbL 1.0
(`manifest.licenciaDeLosArchivos`). Toda vista que muestre estos datos debe citar a las dos fuentes.

## 9. Versiones

Cambiar la estructura de una sección o el significado de un código obliga a subir `version` en
`tnt3.json` (el decodificador rechaza versiones que no conoce). Agregar una sección nueva no rompe
a los lectores viejos, que buscan por id.
