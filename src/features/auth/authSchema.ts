import type { TFunction } from 'i18next';
import { z } from 'zod';

// Mismas reglas que la API (app/schemas/auth.py): correo simple, clave de 8 a 72 bytes al registrarse.
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const bytes = (value: string) => new TextEncoder().encode(value).length;

const email = (t: TFunction) =>
  z.string().trim().toLowerCase().max(254, t('forms.max', { max: 254 })).regex(EMAIL, t('auth.errors.email'));

export function loginSchema(t: TFunction) {
  return z.object({
    email: email(t),
    password: z.string().min(1, t('forms.required')).refine((v) => bytes(v) <= 72, t('auth.errors.passwordMax')),
  });
}

export function registerSchema(t: TFunction) {
  return z.object({
    nombre: z.string().trim().min(1, t('forms.required')).max(120, t('forms.max', { max: 120 })),
    email: email(t),
    password: z
      .string()
      .min(8, t('auth.errors.passwordMin'))
      .refine((v) => bytes(v) <= 72, t('auth.errors.passwordMax')),
  });
}

export type LoginInput = z.input<ReturnType<typeof loginSchema>>;
export type LoginOutput = z.output<ReturnType<typeof loginSchema>>;
export type RegisterInput = z.input<ReturnType<typeof registerSchema>>;
export type RegisterOutput = z.output<ReturnType<typeof registerSchema>>;
