// Fotos locales en WebP a 640 y 1280 px (H11, D66): la miniatura sale de la grande.
const LARGE = /-1280\.webp$/;

/** Miniatura y srcset de una foto local; si no tiene las dos versiones, se usa tal cual. */
export function photoSet(url: string): { src: string; srcSet?: string } {
  if (!LARGE.test(url)) return { src: url };
  const small = url.replace(LARGE, '-640.webp');
  return { src: small, srcSet: `${small} 640w, ${url} 1280w` };
}

const LICENSES: Record<string, string> = {
  'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0',
  'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0',
  'CC BY-SA 3.0': 'https://creativecommons.org/licenses/by-sa/3.0',
  'CC BY 2.0': 'https://creativecommons.org/licenses/by/2.0',
};

/** Texto legal de una licencia Creative Commons conocida; null si no se conoce. */
export function licenseUrl(license: string | null): string | null {
  return license ? (LICENSES[license] ?? null) : null;
}

const COMMONS = 'https://commons.wikimedia.org/wiki/File:';
const MAPILLARY = 'https://www.mapillary.com/app/?pKey=';

/** Página de origen de la foto: Wikimedia Commons (D66) o Mapillary (H35); otras no se enlazan. */
export function sourcePage(ref: string | null | undefined): string | null {
  return ref?.startsWith(COMMONS) || ref?.startsWith(MAPILLARY) ? ref : null;
}

/** Perfil del autor en Mapillary (su formato de atribución lo enlaza); null fuera de Mapillary. */
export function authorPage(ref: string | null | undefined, author: string | null): string | null {
  return author && ref?.startsWith(MAPILLARY) ? `https://www.mapillary.com/app/user/${encodeURIComponent(author)}` : null;
}

/** Texto alternativo en el idioma de la interfaz (H35: ES y EN). */
export function photoAlt(photo: { alt_text: string; alt_text_en?: string | null }, lang: string): string {
  return lang === 'en' && photo.alt_text_en ? photo.alt_text_en : photo.alt_text;
}
