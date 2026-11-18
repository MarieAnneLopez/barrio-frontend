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
  /** Andenes por regla a los lados de las calzadas: base + rango × paso + unos mm por vía (sidewalkLevel). */
  sidewalk: 0.12,
  sidewalkRankStep: 0.005,
  /** Calzadas: base + rango × paso (las avenidas quedan encima en los cruces). */
  road: 0.16,
  rankStep: 0.02,
  /** Cebras y cruces de ciclorruta, sobre todas las calzadas. */
  marks: 0.34,
} as const;

export const roadLevel = (rank: number) => LEVEL.road + rank * LEVEL.rankStep;

/**
 * Andén de la vía `way` de rango `rank`: en una esquina se solapan los de dos calles y, en el mismo
 * plano, parpadearían (cada uno con su bordillo y su brillo). El de la calle mayor queda encima y,
 * entre calles del mismo rango (los separadores de las avenidas dobles), cada vía sube 0–3 mm, menos
 * que un paso de rango. Siempre bajo cualquier calzada (roadLevel(0)).
 */
export const sidewalkLevel = (rank: number, way: number) => LEVEL.sidewalk + rank * LEVEL.sidewalkRankStep + (way % 4) * 0.001;
