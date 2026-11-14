import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { ApiError } from '../../lib/apiClient';
import { register as registerAccount, toApiError } from './authApi';
import { AuthError } from './AuthError';
import { registerSchema, type RegisterInput, type RegisterOutput } from './authSchema';

/** Registro público: siempre crea una cuenta de visitante (califica, no edita). */
export function RegisterForm({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const [failure, setFailure] = useState<ApiError | null>(null);
  const { register, handleSubmit, formState } = useForm<RegisterInput, unknown, RegisterOutput>({
    resolver: zodResolver(registerSchema(t)),
    defaultValues: { nombre: '', email: '', password: '' },
  });
  const { errors, isSubmitting } = formState;

  const submit = async (values: RegisterOutput) => {
    setFailure(null);
    try {
      await registerAccount(values);
      onDone();
    } catch (error) {
      setFailure(toApiError(error));
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
      <Input label={t('auth.name')} autoComplete="name" maxLength={120} error={errors.nombre?.message}
        {...register('nombre')} />
      <Input label={t('auth.email')} type="email" autoComplete="email" error={errors.email?.message}
        {...register('email')} />
      <Input label={t('auth.password')} type="password" autoComplete="new-password" hint={t('auth.passwordHint')}
        error={errors.password?.message} {...register('password')} />
      <AuthError error={failure} />
      <Button type="submit" loading={isSubmitting} className="self-start">{t('auth.createAccount')}</Button>
    </form>
  );
}
