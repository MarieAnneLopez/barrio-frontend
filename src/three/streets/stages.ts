// En qué cuadro se arma cada capa de calles y vida. useStage avanza una etapa por cuadro desde que se
// crea el lienzo, así que cada número es una tarea aparte del hilo principal: una pieza pesada por
// cuadro (≈ 10–22 ms en frío en escritorio, medidas en el informe) y ninguna en el cuadro 0, que ya
// crea el lienzo y compila los sombreadores. Streets y Vida llevan cada una su contador: se montan
// juntas en TintalScene y avanzan a la par.

export const STAGE = {
  /** Red vial, suelo (áreas) y canales. */
  ground: 1,
  /** Senderos, ciclorrutas, plazas y puentes. */
  paths: 2,
  /** Calzadas y andenes. */
  roads: 3,
  /** Cebras, semáforos y faroles. */
  furniture: 4,
  /** Dónde no van los árboles decorativos (huellas de los edificios, canchas, vías) y luego los árboles. */
  treeGround: 5,
  trees: 6,
  /** Grafo de carriles y luego los carros. */
  lanes: 7,
  cars: 8,
  /** Caminos de las personitas, su recorte contra los edificios y luego la gente y los aviones. */
  walks: 9,
  clip: 10,
  people: 11,
} as const;
