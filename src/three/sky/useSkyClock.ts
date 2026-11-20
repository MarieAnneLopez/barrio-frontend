import { DAY_MS, DUSK_MS, NIGHT_MS, skyAt } from './cycle';

/** La luna, las ventanas, las farolas y el vidrio usan la misma noche en todas las rutas. */
export const NIGHT_SKY = Object.freeze(skyAt(DAY_MS + DUSK_MS + NIGHT_MS / 2));
