import { useTranslation } from 'react-i18next';
import type { UseFormRegister } from 'react-hook-form';
import type { FormValues } from './formSchema';

export function EditorialFields({ register }: { register: UseFormRegister<FormValues> }) {
  const { t } = useTranslation('editorial');
  return (
    <>
      {(['descripcion_es', 'descripcion_en'] as const).map((name) => (
        <label key={name} className="flex flex-col gap-1 text-fg-secondary">
          {t(name)}
          <textarea {...register(name)} lang={name === 'descripcion_es' ? 'es' : 'en'}
            rows={3} maxLength={1000} className="ui-field rounded-sm border border-ink bg-stone px-3 py-2 text-on-stone" />
        </label>
      ))}
      <label className="flex flex-col gap-1 text-fg-secondary">
        {t('visibility')}
        <select {...register('publicado')} className="ui-field min-h-11 rounded-sm border border-ink bg-stone px-3 text-on-stone">
          <option value="true">{t('published')}</option>
          <option value="false">{t('draft')}</option>
        </select>
      </label>
    </>
  );
}
