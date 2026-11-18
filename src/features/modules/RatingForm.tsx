import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StarsInput } from '../../components/ui/StarsInput';
import { StateIcon } from '../../components/ui/StateIcon';
import { ApiError, apiSend } from '../../lib/apiClient';
import { useAuthStore } from '../../store/authStore';
import { useAvatarStore } from '../../store/avatarStore';
import { ratingSchema, toPayload, type RatingInput, type RatingOutput } from './ratingSchema';

interface RatingFormProps {
  path: string;
  onRated: () => void;
}

type Status = { kind: 'idle' } | { kind: 'done' } | { kind: 'error'; message: string };

/** Formulario de reseña validado con zod; si la sesión vence (401), pide iniciarla de nuevo. */
export function RatingForm({ path, onRated }: RatingFormProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const { control, register, handleSubmit, reset, formState } = useForm<RatingInput, unknown, RatingOutput>({
    resolver: zodResolver(ratingSchema(t)),
    defaultValues: { comentario: '', autor_nombre: '' },
  });
  const { errors, isSubmitting } = formState;

  const submit = async (values: RatingOutput) => {
    try {
      await apiSend('POST', path, toPayload(values));
      reset({ comentario: '', autor_nombre: '' });
      setStatus({ kind: 'done' });
      // §11.4.2: salta de alegría con 4,5 estrellas o más.
      if (values.estrellas >= 4.5) useAvatarStore.getState().dispatch({ type: 'CELEBRATE' });
      onRated();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) useAuthStore.getState().expire();
      else {
        setStatus({ kind: 'error', message: error instanceof Error ? error.message : String(error) });
        useAvatarStore.getState().dispatch({ type: 'ERROR' });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-3">
      <Controller
        control={control}
        name="estrellas"
        render={({ field }) => (
          <StarsInput legend={t('ratings.yourRating')} value={field.value} onChange={field.onChange}
            error={errors.estrellas?.message} />
        )}
      />
      <Input label={t('ratings.comment')} maxLength={500} error={errors.comentario?.message} {...register('comentario')} />
      <Input label={t('ratings.author')} maxLength={120} error={errors.autor_nombre?.message} {...register('autor_nombre')} />
      <Button type="submit" variant="secondary" disabled={isSubmitting} className="self-start">
        {t('ratings.submit')}
      </Button>
      <p aria-live="polite" className="m-0 text-step--1 text-fg-secondary">
        {/* Estado con ícono y texto (D100, PAL-06): el visto del éxito o el aspa del error. */}
        {status.kind === 'done' ? <><StateIcon kind="success" />{t('ratings.thanks')}</> : null}
        {status.kind === 'error' ? <><StateIcon kind="error" />{status.message}</> : null}
      </p>
    </form>
  );
}
