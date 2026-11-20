import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { chatStatus } from '../../lib/chatApi';

/** Aviso antes de enviar: el proveedor puede recibir preguntas del usuario. */
export function ChatPrivacyNotice() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    let mounted = true;
    void chatStatus().then(({ proveedor }) => { if (mounted) setVisible(proveedor !== null); });
    return () => { mounted = false; };
  }, []);
  if (!visible) return null;
  return <p className="m-0 px-4 pb-2 text-step--2 leading-snug text-fg-muted">{t('chat.privacy')}</p>;
}
