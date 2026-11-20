import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';

interface Props {
  drafts: boolean;
  notLoaded: boolean;
  onDrafts: (value: boolean) => void;
  onAdd: () => void;
}

export function AdminListControls({ drafts, notLoaded, onDrafts, onAdd }: Props) {
  const { t } = useTranslation();
  return (
    <>
      <label className="flex min-h-11 items-center gap-2">
        <input type="checkbox" checked={drafts} onChange={(event) => onDrafts(event.target.checked)} />
        {t('editorial:drafts')}
      </label>
      <Button variant="secondary" onClick={onAdd} disabled={notLoaded}>{t('forms.add')}</Button>
    </>
  );
}
