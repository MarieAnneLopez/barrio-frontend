import type { TFunction } from 'i18next';
import { z } from 'zod';

/** Reseña (§11.3 punto 5): 0,5 a 5 estrellas en pasos de 0,5; mismo límite que la API. */
export function ratingSchema(t: TFunction) {
  return z.object({
    estrellas: z
      .number({ error: t('ratings.required') })
      .min(0.5, t('ratings.required'))
      .max(5)
      .multipleOf(0.5),
    comentario: z.string().trim().max(500, t('forms.max', { max: 500 })),
    autor_nombre: z.string().trim().max(120, t('forms.max', { max: 120 })),
  });
}

export type RatingInput = z.input<ReturnType<typeof ratingSchema>>;
export type RatingOutput = z.output<ReturnType<typeof ratingSchema>>;

/** Lo que se envía: los textos vacíos viajan como null. */
export const toPayload = (v: RatingOutput) => ({
  estrellas: v.estrellas,
  comentario: v.comentario || null,
  autor_nombre: v.autor_nombre || null,
});
