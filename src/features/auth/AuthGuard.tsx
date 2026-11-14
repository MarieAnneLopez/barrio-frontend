import type { ReactNode } from 'react';
import { useAuthStore } from '../../store/authStore';

interface AuthGuardProps {
  /** admin: crear, editar, borrar y fotos. user: cualquier sesión (calificar). */
  role: 'admin' | 'user';
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Muestra su contenido solo con el rol pedido. Es comodidad de interfaz: quien
 * protege los datos es la API (require_admin / require_user).
 */
export function AuthGuard({ role, children, fallback = null }: AuthGuardProps) {
  const user = useAuthStore((s) => s.user);
  const allowed = user !== null && (role === 'user' || user.rol === 'admin');
  return <>{allowed ? children : fallback}</>;
}
