import { ApiError, apiGet, apiSend } from '../../lib/apiClient';
import { useAuthStore } from '../../store/authStore';

/** Cuenta con sesión (D58): el token vive en una cookie httpOnly que el JS no lee. */
export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: 'admin' | 'visitante';
}

interface Sesion {
  usuario: Usuario;
  expires_in: number;
}

export interface Credentials {
  email: string;
  password: string;
}

async function openSession(path: string, body: object): Promise<Usuario> {
  const sesion = await apiSend<Sesion>('POST', path, body);
  if (!sesion) throw new ApiError(0, 'EMPTY_RESPONSE', 'Respuesta vacía del servidor');
  useAuthStore.getState().signIn(sesion.usuario);
  return sesion.usuario;
}

export const login = (data: Credentials) => openSession('/auth/login', data);
export const register = (data: Credentials & { nombre: string }) => openSession('/auth/register', data);

export async function logout(): Promise<void> {
  await apiSend('POST', '/auth/logout');
  useAuthStore.getState().signOut();
}

/**
 * Al cargar la app: si la cookie sigue vigente, recupera quién inició sesión.
 * /auth/session responde 200 también sin sesión (null), así la consola queda limpia.
 */
export async function restoreSession(signal?: AbortSignal): Promise<void> {
  try {
    const { usuario } = await apiGet<{ usuario: Usuario | null }>('/auth/session', undefined, signal);
    if (usuario) useAuthStore.getState().signIn(usuario);
    else useAuthStore.getState().signOut();
  } catch {
    if (!signal?.aborted) useAuthStore.getState().signOut();
  }
}

export const toApiError = (error: unknown) =>
  error instanceof ApiError ? error : new ApiError(0, 'UNKNOWN', String(error));
