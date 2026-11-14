import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useFocusTrap } from './useFocusTrap';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Diálogo modal: aria-modal, trampa de foco, Escape y clic fuera cierran,
 * bloqueo de scroll y foco devuelto al disparador. Entra desde scale(0.96).
 */
export function Modal({ open, onClose, title, description, children, footer }: ModalProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const descId = useId();
  const panel = useRef<HTMLDivElement>(null);
  useFocusTrap(panel, open, onClose);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="ui-modal-backdrop absolute inset-0 bg-[var(--overlay)]"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className="ui-modal-panel glass relative w-full max-w-lg rounded-lg bg-surface p-6 shadow-[var(--shadow-deep)]"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="m-0 text-step-2 text-fg">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('ui.close')}
            className="ui-pressable ui-btn--ghost -mt-1 -mr-2 inline-flex size-11 items-center justify-center rounded-md border border-transparent text-fg-secondary"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
        {description ? (
          <p id={descId} className="mt-0 mb-4 text-fg-secondary">
            {description}
          </p>
        ) : null}
        <div className="text-fg">{children}</div>
        {footer ? <div className="mt-6 flex justify-end gap-3">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
