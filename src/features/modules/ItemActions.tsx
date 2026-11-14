import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { ApiError, apiSend } from '../../lib/apiClient';
import { WriteError } from './WriteError';

interface ItemActionsProps {
  path: string;
  name: string;
  onEdit: () => void;
  onDeleted: () => void;
}

/** Editar y eliminar desde la ficha; eliminar pide confirmación en el mismo lugar. */
export function ItemActions({ path, name, onEdit, onDeleted }: ItemActionsProps) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<ApiError | null>(null);

  const remove = async () => {
    setBusy(true);
    setFailure(null);
    try {
      await apiSend('DELETE', path);
      onDeleted();
    } catch (error) {
      setFailure(error instanceof ApiError ? error : new ApiError(0, 'UNKNOWN', String(error)));
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 border-t border-line pt-4">
      {confirming ? (
        <div role="group" aria-label={t('forms.confirmDelete', { name })} className="flex flex-wrap items-center gap-3">
          <p className="m-0 text-step--1 text-fg">{t('forms.confirmDelete', { name })}</p>
          <Button variant="primary" size="sm" onClick={remove} disabled={busy}>{t('forms.confirm')}</Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>{t('forms.cancel')}</Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" onClick={onEdit}>{t('forms.edit')}</Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>{t('forms.delete')}</Button>
        </div>
      )}
      <WriteError error={failure} />
    </div>
  );
}
