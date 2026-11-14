import { useId } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Input } from '../../components/ui/Input';
import type { FieldSpec } from '../../lib/moduleFields';
import { displayValue } from './displayValue';

interface FormFieldProps {
  slug: string;
  field: FieldSpec;
  registration: UseFormRegisterReturn;
  error: string | undefined;
}

const SELECT = 'ui-field min-h-11 w-full rounded-md border border-line bg-surface px-3 text-step-0 text-fg';
const INPUT_TYPE: Partial<Record<FieldSpec['kind'], string>> = { date: 'date', tel: 'tel' };

/** Un control por tipo de campo: texto, área de texto, lista, sí/no, número o fecha. */
export function FormField({ slug, field, registration, error }: FormFieldProps) {
  const { t, i18n } = useTranslation();
  const id = useId();
  const label = `${t(`fields.${field.name}`)}${field.required ? ' *' : ''}`;
  const errorNode = error ? (
    <p id={`${id}-error`} role="alert" className="m-0 text-step--1 text-error">
      {error}
    </p>
  ) : null;
  const a11y = { id, 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? `${id}-error` : undefined };

  if (field.kind === 'enum' || field.kind === 'boolean') {
    const options = field.kind === 'boolean' ? ['true', 'false'] : (field.options ?? []);
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-step--1 font-medium text-fg-secondary">{label}</label>
        <select {...registration} {...a11y} className={SELECT}>
          <option value="">{t('forms.none')}</option>
          {options.map((o) => (
            <option key={o} value={o}>{displayValue(t, slug, field.name, o, i18n.language)}</option>
          ))}
        </select>
        {errorNode}
      </div>
    );
  }
  if (field.kind === 'textarea') {
    return (
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="text-step--1 font-medium text-fg-secondary">{label}</label>
        <textarea {...registration} {...a11y} rows={3} maxLength={field.max} className={`${SELECT} py-2`} />
        {errorNode}
      </div>
    );
  }
  const numeric = field.kind === 'number' || field.kind === 'integer';
  return (
    <Input
      label={label}
      type={INPUT_TYPE[field.kind] ?? 'text'}
      inputMode={numeric ? 'decimal' : undefined}
      maxLength={numeric ? undefined : field.max}
      error={error}
      {...registration}
    />
  );
}
