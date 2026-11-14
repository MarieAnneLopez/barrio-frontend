import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { filterFields } from '../../lib/moduleFields';
import { displayValue } from './displayValue';
import type { Filters } from './useModuleData';

interface ModuleFiltersProps {
  slug: string;
  value: Filters;
  onChange: (filters: Filters) => void;
  disabled?: boolean;
}

const BOOLEAN = ['true', 'false'];

/** Un selector por campo filtrable del módulo; "Todos" quita el filtro. */
export function ModuleFilters({ slug, value, onChange, disabled }: ModuleFiltersProps) {
  const { t, i18n } = useTranslation();
  const baseId = useId();
  const fields = filterFields(slug);
  if (!fields.length) return null;

  const set = (name: string, option: string) => {
    const rest = Object.fromEntries(Object.entries(value).filter(([key]) => key !== name));
    onChange(option ? { ...rest, [name]: option } : rest);
  };

  return (
    <fieldset className="m-0 flex flex-wrap gap-3 border-0 p-0" disabled={disabled}>
      <legend className="mb-2 p-0 text-step--1 text-fg-muted">{t('modules.filters')}</legend>
      {fields.map((field) => {
        const id = `${baseId}-${field.name}`;
        const options = field.kind === 'boolean' ? BOOLEAN : (field.options ?? []);
        return (
          <div key={field.name} className="flex min-w-[10rem] flex-1 flex-col gap-1">
            <label htmlFor={id} className="text-step--1 text-fg-secondary">
              {t(`fields.${field.name}`)}
            </label>
            <select
              id={id}
              value={value[field.name] ?? ''}
              onChange={(e) => set(field.name, e.target.value)}
              className="ui-input rounded-sm border border-line bg-surface px-2 py-2 text-step--1 text-fg"
            >
              <option value="">{t('modules.all')}</option>
              {options.map((option) => (
                <option key={option} value={option}>
                  {displayValue(t, slug, field.name, option, i18n.language)}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </fieldset>
  );
}
