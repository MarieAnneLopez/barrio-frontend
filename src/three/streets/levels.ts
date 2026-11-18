// Alturas de las capas a ras de suelo (m), de abajo arriba, sobre el suelo de la isla (y = 0). Unos
// centímetros bastan: el plano cercano de la cámara va a media distancia (CameraRig) y la precisión
// de profundidad a la distancia de inicio es de décimas de milímetro.
export const LEVEL = {
  /** Canales y quebradas (TNT3.suelo.lineas). */
  canal: 0.08,
  /** Plazas peatonales (vías con area=yes). */
  plaza: 0.09,
  /** Andenes, senderos y ciclorrutas de OSM. */
  foot: 0.1,
  /** Andenes por regla a los lados de las calzadas. */
  sidewalk: 0.12,
  /** Calzadas: base + rango × paso (las avenidas quedan encima en los cruces). */
  road: 0.16,
  rankStep: 0.02,
  /** Cebras y cruces de ciclorruta, sobre todas las calzadas. */
  marks: 0.34,
} as const;

export const roadLevel = (rank: number) => LEVEL.road + rank * LEVEL.rankStep;
