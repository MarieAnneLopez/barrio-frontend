import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { ApiError, apiSend } from '../../lib/apiClient';
import { useAvatarStore } from '../../store/avatarStore';
import type { ModuleItem } from '../../lib/apiTypes';
import type { CategoryConfig } from '../../lib/categoryConfig';
import { moduleFields } from '../../lib/moduleFields';
import { buildFormSchema, toPayload, type FormValues } from './formSchema';
import { FormField } from './FormField';
import { toFormValues } from './formValues';
import { WriteError } from './WriteError';

interface CrudFormModalProps {
  category: CategoryConfig;
  /** undefined = crear; un registro = editarlo. */
  item: ModuleItem | undefined;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

/** Crear o editar un lugar (§11.3): campos del módulo validados con zod, como la API. */
export function CrudFormModal({ category, item, open, onClose, onSaved }: CrudFormModalProps) {
  const { t } = useTranslation();
  const { slug, geometry } = category;
  const { fields } = moduleFields(slug);
  const creating = item === undefined;
  const schema = useMemo(() => buildFormSchema(fields, geometry, creating, t), [fields, geometry, creating, t]);
  const [failure, setFailure] = useState<ApiError | null>(null);
  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: toFormValues(item, fields, geometry),
  });
  const { errors, isSubmitting } = formState;
  const err = (name: string) => errors[name]?.message;

  const submit = async (values: FormValues) => {
    setFailure(null);
    try {
      const body = toPayload(values, fields, geometry);
      if (creating) await apiSend('POST', `/${slug}`, body);
      else await apiSend('PATCH', `/${slug}/${item.id}`, body);
      useAvatarStore.getState().dispatch({ type: 'CELEBRATE' });
      onSaved();
    } catch (error) {
      setFailure(error instanceof ApiError ? error : new ApiError(0, 'UNKNOWN', String(error)));
    }
  };

  const title = creating ? t('forms.createTitle') : t('forms.editTitle');
  return (
    <Modal open={open} onClose={onClose} title={title} description={t('forms.requiredHint')} wide>
      <form onSubmit={handleSubmit(submit)} noValidate className="flex max-h-[65dvh] flex-col gap-4 overflow-y-auto pr-1">
        {fields.map((f) => (
          <FormField key={f.name} slug={slug} field={f} registration={register(f.name)} error={err(f.name)} />
        ))}
        {geometry === 'POINT' ? (
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('forms.lon')} inputMode="decimal" error={err('lon')} {...register('lon')} />
            <Input label={t('forms.lat')} inputMode="decimal" error={err('lat')} {...register('lat')} />
          </div>
        ) : (
          <FormField
            slug={slug}
            field={{ name: 'geometry', kind: 'textarea', required: creating && geometry !== 'FICHA' }}
            registration={register('geometry')}
            error={err('geometry')}
          />
        )}
        <WriteError error={failure} />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>{t('forms.cancel')}</Button>
          <Button type="submit" disabled={isSubmitting}>{creating ? t('forms.create') : t('forms.save')}</Button>
        </div>
      </form>
    </Modal>
  );
}
