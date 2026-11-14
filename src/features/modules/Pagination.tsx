import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';

interface PaginationProps {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, pages, onChange }: PaginationProps) {
  const { t } = useTranslation();
  if (pages <= 1) return null;
  return (
    <nav aria-label={t('modules.pagination')} className="flex items-center justify-between gap-3">
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        {t('modules.previous')}
      </Button>
      <p className="m-0 font-mono text-step--1 text-fg-muted" aria-live="polite">
        {t('modules.pageOf', { page, pages })}
      </p>
      <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        {t('modules.next')}
      </Button>
    </nav>
  );
}
