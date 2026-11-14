import type { Usuario } from '../features/auth/authApi';

export const ADMIN: Usuario = { id: 1, email: 'admin@eltintal.local', nombre: 'Administración', rol: 'admin' };
export const VISITANTE: Usuario = { id: 2, email: 'vecina@correo.co', nombre: 'Vecina del Tintal', rol: 'visitante' };

export const AUTH_REQUIRED = { status: 401, body: { error: { code: 'AUTH_REQUIRED', message: 'Inicia sesión' } } };

/** Respuesta de GET /auth/session al cargar la app: con sesión de `user` o sin sesión (null). */
export const sessionAs = (user: Usuario | null) => ({ '/auth/session': { body: { usuario: user } } });
