// Cuántos carros y personas se animan: la base a densidad 1 (calidad alta) y la fracción que fija la
// calidad adaptable (QUALITY[level].density). Las mallas se crean para la base y dibujan solo `count`.

export const BASE_CARS = 520;
export const BASE_PEOPLE = 760;

export function vidaCounts(density: number): { cars: number; people: number } {
  const d = Math.min(1, Math.max(0, density));
  return { cars: Math.round(BASE_CARS * d), people: Math.round(BASE_PEOPLE * d) };
}
