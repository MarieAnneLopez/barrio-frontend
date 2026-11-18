# Datos 3D reales de El Tintal (`npm run datos:3d`)

Prepara **una vez, en tiempo de build**, los datos de la maqueta 3D en `public/data/tintal/`
(cuatro `.bin.gz` + `manifest.json`, formato en [FORMATO.md](FORMATO.md)). El navegador del
visitante solo pide esos archivos a su mismo origen: no consulta Catastro, OSM ni ningún servicio
externo. Nada es inventado ni «dato de ejemplo»; lo que la fuente no trae queda como «sin dato».

```bash
npm run datos:3d                 # usa la caché si existe (idéntico byte a byte con el mismo Node)
npm run datos:3d -- --refrescar  # vuelve a descargar todo (versión vigente de cada fuente)
```

Desde la caché, la salida es idéntica byte a byte con la misma versión de Node (24.20.0 para los
datos comitidos): la cabecera gzip no lleva fecha ni sistema, pero los bytes comprimidos dependen
del zlib de cada versión de Node.

Requisitos: Node 24 (`.nvmrc`; usa `fetch`, `zlib` y `crypto` de Node) y red. Sin dependencias
nuevas. Tarda ~75 s descargando y ~3 s desde la caché.

| Variable | Por defecto | Para qué |
|---|---|---|
| `DATOS3D_CACHE` | `~/gran-datos/datos3d` | caché de descargas, fuera del repo (no se comitea) |
| `TINTAL_POLIGONO` | `https://reconoce-el-tintal.pages.dev/api/v1/barrio/poligono` | URL o archivo GeoJSON del polígono |
| `OVERPASS_URL` | overpass-api.de, luego private.coffee y kumi.systems | servidores Overpass separados por comas |

## Fuentes (consultadas el 2026-11-18 04:33 UTC, 17 de noviembre 23:33 en Bogotá)

| Capa | Entidad | Consulta | Conjunto en el portal | Versión |
|---|---|---|---|---|
| Polígono de El Tintal (D38/D62: UPZ 78 Tintal Norte + UPZ 79 Calandaima) | OpenStreetMap, servido por la API del proyecto | `https://reconoce-el-tintal.pages.dev/api/v1/barrio/poligono` | relaciones OSM 11360088 y 11350645 | OSM al 2026-11-14T06:53:36Z |
| Construcción | UAECD | `https://serviciosgis.catastrobogota.gov.co/arcgis/rest/services/catastro/construccion/MapServer/0` | https://datosabiertos.bogota.gov.co/dataset/construccion | servicio vigente; última publicación 10.26 |
| Lote | UAECD | `…/catastro/lote/MapServer/0` | https://datosabiertos.bogota.gov.co/dataset/lote | servicio vigente; última publicación 10.26 |
| Placa Domiciliaria | UAECD | `…/catastro/placadomiciliaria/MapServer/0` | https://datosabiertos.bogota.gov.co/dataset/placa-domiciliaria | 10.26 (verificado, abajo) |
| Sector Catastral | UAECD | `…/catastro/sectorcatastral/MapServer/0` | https://datosabiertos.bogota.gov.co/dataset/sector-catastral | servicio vigente; última publicación 10.26 |
| OpenStreetMap | OSMF y colaboradores | `https://overpass-api.de/api/interpreter` | https://www.openstreetmap.org | datos OSM al 2026-11-18T04:33:05Z |

**Licencias, con el texto tal como lo publica cada fuente:**

- **Construcción, Lote, Placa Domiciliaria y Sector Catastral** (las cuatro páginas del portal,
  bajo el encabezado «Licencia», y el `license_title` de su API CKAN): «Creative Commons
  Attribution 4.0» (https://creativecommons.org/licenses/by/4.0/). Atribución que publica cada
  servicio (`copyrightText`): «Unidad Administrativa Especial de Catastro Distrital - UAECD».
- **OpenStreetMap** (https://www.openstreetmap.org/copyright): «OpenStreetMap is open data,
  licensed under the Open Data Commons Open Database License (ODbL) by the OpenStreetMap Foundation
  (OSMF).» y «Where you use OpenStreetMap data, you are required to do the following two things:
  Provide credit to OpenStreetMap by displaying our attribution notice. Make clear that the data is
  available under the Open Database License.» Aviso de cada respuesta de Overpass: «The data
  included in this document is from www.openstreetmap.org. The data is made available under ODbL.»
  Atribución: «© OpenStreetMap contributors».
- **Polígono**: «© OpenStreetMap contributors, ODbL 1.0» (propiedad `license` de la API).

Los archivos generados son, en lo que viene de OSM, una base de datos derivada bajo ODbL 1.0
(https://opendatacommons.org/licenses/odbl/1-0/); lo de Catastro sigue en CC BY 4.0 y está
**modificado** (CC BY 4.0 §3(a)(1)(B) pide indicarlo): recortado al barrio, huellas limpiadas y
redondeadas a 10 cm en una proyección local, direcciones armadas desde las placas y unidas a cada
edificio por código de lote, recodificado en TNT3 y unido con nombres y edificios de OSM. La vista
que los muestre debe citar las dos atribuciones e indicar que los datos de Catastro fueron
modificados (`manifest.licenciaDeLosArchivos`).

## Método

1. **Polígono y proyección.** El polígono de la API (el mismo que recibe la escena) define el
   recorte; su bbox fija el origen de `src/three/projection.ts`. `geo.test.mjs` comprueba que la
   proyección del script da lo mismo que la de la escena, y `realData.test.ts` que el borde del
   barrio decodificado llena justo el bbox del manifiesto con la proyección de la escena.
2. **Catastro por ArcGIS REST, solo el recorte.** Consulta espacial `esriSpatialRelIntersects`
   con el polígono → OBJECTID; luego las entidades en lotes de 1000 (`f=geojson`, WGS84, 7
   decimales). La paginación por `resultOffset` con geometría devuelve vacío en ese servidor; por
   ids funciona. El portal (API CKAN) da título, licencia y última versión publicada.
3. **Edificios.** Cada polígono de Construcción cuyo punto interior cae en el barrio (20 381, todos):
   huella limpia a decímetros, pisos (`CONNPISOS`), arranque del voladizo (`CONALTURA`), sótanos,
   mejora y lote (`LOTECODIGO`). Catastro publica pisos, no alturas.
   **`CONALTURA` como piso de arranque es una interpretación deducida de los datos**: el servicio
   solo lo publica como «Altura» (Double), sin dominio ni descripción. Cuadra en el barrio: en los
   2 908 voladizos vale 1 (2 903) o 2 (5) y en lo demás 0 (17 282), −1 (181), −1,5 (7) o 1 (3);
   arranque + pisos del voladizo nunca pasa del edificio más alto de su lote (2 365 iguales, 543
   menores, 0 mayores); `CONELEVACI` = `CONNPISOS` en 2 907 de los 2 908 voladizos, y en 181 de
   las 188 construcciones con sótano que no son voladizo vale `CONNPISOS` + 1.
4. **Complemento OSM.** Un edificio de OSM entra solo si menos de un tercio de su huella cae sobre
   construcciones de Catastro (rejilla de 8×8 puntos): 13 de 230. Su lote sale de la capa Lote.
5. **Dirección oficial.** Por el código de lote (Construcción `LOTECODIGO` = Lote `LOTCODIGO` =
   Placa `PDOCLOTE`): la placa del lote que cae dentro de la huella; si no, la más cercana del
   lote; si el lote no tiene, la más cercana de su manzana (9 primeros dígitos). Empate a igual
   distancia: el `PDOTIPO` menor y luego `PDOCODIGO`; la capa publica `PDOTIPO` como su campo de
   subtipos (`typeIdField`, en `…/placadomiciliaria/MapServer/0?f=json`): 1 Principal,
   2 Secundaria, 3 Incluye, 4 Adicional PH, 5 Provisional DSU (en el barrio: 15 906 / 640 / 207 de
   los tres primeros), así que la principal gana. El número de casa, torre o interior solo
   va con el edificio al que identifica: el único interior dentro de la huella, o el edificio del
   lote más cercano a la placa y a menos de 5 m. Si no, y siempre con la placa de la manzana,
   queda la dirección del conjunto (vía y número): así salen 1 312 edificios (297 huellas con
   varias casas dentro, 1 007 cuya placa más cercana es de otro edificio o está lejos y 8 de la
   manzana). Texto: `PDONVIAL # PDOTEXTO` con guion (`KR 87B # 6D-20`); en placas
   interiores, el número del conjunto (`PDOCINTERI`) y luego el interior (`KR 88D # 6D-27 TO 6`).
   `PDOCINTERI` solo cuenta como número si tiene la forma «cruce distancia» (en 22 placas trae
   `8` o `MJ 34`): si no, queda vía e interior (`CL 34A S IN 8`), y un interior sin vía ni número
   no es dirección.
   La unión es por código y no por posición: medido en el barrio, de las 16 740 placas cuyo lote
   está en la capa Lote, solo 14 520 (86,7 %) caen dentro del polígono de su propio lote; 1 277
   (7,6 %) caen en otro lote y 943 (5,6 %) en el andén o la vía.
6. **Nombre de conjunto o lugar** (Catastro no publica nombres): el edificio OSM con nombre que lo
   contiene o, si no, el área OSM con nombre más pequeña que lo contiene (conjuntos residenciales,
   colegios, parques, comercio). El sector catastral (`SCANOMBRE`) va aparte, por el código de lote.
7. **OSM por Overpass** (una consulta con la caja del barrio): vías y caminos recortados al
   polígono con nodos compartidos (grafo), sentido, carriles, velocidad, nivel, puentes y accesos;
   cruces peatonales con eje de la calle, largo y marcas; semáforos; parques, pasto y agua
   recortados al barrio; canales; árboles, hileras y faroles reales.

**Verificación de versión (2026-11-17):** las 16 753 placas del servicio REST dentro del polígono
coinciden una a una (código, textos, lote y tipo, sin contar espacios al final) con el GeoPackage
`pdom.gpkg.10.26.zip` del portal (versión vigente, publicada el 2026-11-05).

## Resultado (2026-11-18)

| Dato | Valor |
|---|---|
| Edificios | 20 394 (20 381 de Catastro + 13 de OSM) |
| Con pisos de Catastro | 20 381 (99,9 %; los 13 de OSM: 1 con `building:levels`, 12 sin dato) |
| Con placa oficial de su lote | 20 356 (99,8 %): 9 907 dentro de la huella, 10 449 la más cercana del lote |
| Placa de la manzana / sin placa | 14 / 24 |
| Con nombre de conjunto o lugar | 11 942 (58,6 %), 48 de ellos con nombre del propio edificio |
| Vías | 1 483 tramos y 5 310 nodos: 528 service, 355 footway, 203 residential, 98 tertiary, 68 sidewalk, 67 crossing, 50 cycleway, 33 secondary, 27 construction, 24 primary, 10 pedestrian, 8 unclassified, 4 track, 4 path, 3 trunk, 1 steps |
| Cruces peatonales | 172 (13 cebra, 106 marcados, 11 sin marcas, 42 sin dato; 60 con semáforo) y 50 semáforos |
| Suelo | 249 áreas (77 pasto, 57 parques, 55 canchas, 24 agua, 23 juegos…) y 32 líneas de agua |
| Árboles reales | 248 sueltos y 20 hileras |
| Faroles reales | 0 (OSM no tiene `highway=street_lamp` en el barrio: ver FORMATO.md §6) |

| Archivo | Bytes |
|---|---|
| `edificios.bin.gz` | 455 034 (1 673 984 sin comprimir) |
| `vias.bin.gz` | 47 106 (89 240) |
| `suelo.bin.gz` | 12 350 (18 912) |
| `puntos.bin.gz` | 1 741 (3 520) |
| `manifest.json` | ~8 KB |
| **Total** | **≈ 0,50 MB** (meta ≤ 6 MB) |

## Pruebas

`npx vitest run scripts/datos3d src/three/data`: geometría y recorte, codificador, placas y
direcciones, etiquetas OSM, red vial y cruces, suelo, decodificador (con un fixture del mismo
codificador) y sus comprobaciones de error, Web Worker y cliente (tiempo límite y respuestas
malas), y los datos comitidos contra su manifiesto y la proyección de la escena
(`realData.test.ts`).
