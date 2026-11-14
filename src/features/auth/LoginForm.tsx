import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { ApiError } from '../../lib/apiClient';
import { login, toApiError } from './authApi';
import { AuthError } from './AuthError';
import { loginSchema, type LoginInput, type LoginOutput } from './authSchema';

/** Inicio de sesión con correo y contraseña; el error de la API no dice cuál de los dos falló. */
export function LoginForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const [failure, setFailure] = useState<ApiError | null>(null);
  const { register, handleSubmit, formState } = useForm<LoginInput, unknown, LoginOutput>({
    resolver: zodResolver(loginSchema(t)),
    defaultValues: { email: '', password: '' },
  });
  const { errors, isSubmitting } = formState;

  const submit = async (values: LoginOutput) => {
    setFailure(null);
    try {
      await login(values);
      onDone();
    } catch (error) {
      setFailure(toApiError(error));
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
      <Input label={t('auth.email')} type="email" autoComplete="username" error={errors.email?.message}
        {...register('email')} />
      <Input label={t('auth.password')} type="password" autoComplete="current-password"
        error={errors.password?.message} {...register('password')} />
      <AuthError error={failure} />
      <Button type="submit" loading={isSubmitting} className="self-start">{t('auth.login')}</Button>
    </form>
  );
}
