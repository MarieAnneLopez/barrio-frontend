import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface ModuleSearchProps {
  onSearch: (query: string) => void;
  disabled?: boolean;
}

/** Búsqueda de texto del módulo: se aplica al enviar, no en cada tecla. */
export function ModuleSearch({ onSearch, disabled }: ModuleSearchProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSearch(draft.trim());
  };

  return (
    <form role="search" onSubmit={submit} className="flex items-end gap-2">
      <Input
        label={t('modules.search')}
        placeholder={t('modules.searchHint')}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={100}
        className="flex-1"
        disabled={disabled}
      />
      <Button type="submit" variant="secondary" disabled={disabled}>
        {t('modules.searchButton')}
      </Button>
    </form>
  );
}
