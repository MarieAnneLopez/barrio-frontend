import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { chatStatus } from '../../lib/chatApi';

/**
 * Aviso de privacidad (H36): si el backend envía los mensajes a Gemini (plan
 * gratuito, que Google puede usar para mejorar sus productos), se avisa antes
 * del primer mensaje que no se escriban datos personales.
 */
export function ChatPrivacyNotice() {
  const { t } = useTranslation();
  const [gemini, setGemini] = useState(false);

  useEffect(() => {
    let alive = true;
    void chatStatus().then((s) => alive && setGemini(s.proveedor === 'gemini'));
    return () => {
      alive = false;
    };
  }, []);

  if (!gemini) return null;
  return <p className="m-0 px-4 pb-2 text-step--2 leading-snug text-fg-muted">{t('chat.privacy')}</p>;
}
