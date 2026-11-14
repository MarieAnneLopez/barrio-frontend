// Contacto directo con la creadora (§11.2.4, §11.5).
export const WHATSAPP_NUMBER = '573132596937';

/** Enlace wa.me con el mensaje inicial codificado. */
export function whatsappUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
