import type { Tintal3D } from '../data/format';

export interface VidaProps {
  world: Tintal3D;
  /** Movimiento reducido: todo quieto (carros parados, personas de pie, sin aviones). */
  still: boolean;
}

/**
 * La vida del barrio: carros por las vías reales respetando sentidos, personitas low-poly y aviones
 * cada 1–3 min, todo instanciado. Punto de montaje del carril «calles y vida» del turno 2; la
 * densidad la fija la calidad adaptable (quality/qualityStore).
 */
export function Vida(props: VidaProps) {
  void props;
  return null;
}
