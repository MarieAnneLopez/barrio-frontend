import { useTranslation } from 'react-i18next';
import { whatsappUrl } from '../../lib/contact';
import { Tooltip } from '../ui/Tooltip';
import { WhatsAppGlyph } from './WhatsAppGlyph';

interface WhatsAppFloatProps {
  /** Con el chat de Mini Marie abierto (H13) sube para no superponerse. */
  raised?: boolean;
}

/**
 * Botón flotante permanente (§11.2.4, D7): glifo noche sobre ámbar
 * (--text-on-interactive sobre --interactive-primary, 6,20:1), pulso sutil (apagado con movimiento reducido) y tooltip.
 */
export function WhatsAppFloat({ raised = false }: WhatsAppFloatProps) {
  const { t } = useTranslation();
  return (
    <div
      className={`fixed right-4 z-40 transition-transform duration-[var(--dur-3)] ease-[var(--ease-emphasis)] md:right-6 ${
        raised ? '-translate-y-24' : ''
      } bottom-4 md:bottom-6`}
    >
      <Tooltip content={t('whatsapp.tooltip')} side="left" delay={300}>
        <a
          href={whatsappUrl(t('whatsapp.message'))}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('whatsapp.label')}
          className="ui-pressable ui-whatsapp relative inline-flex size-14 items-center justify-center rounded-full border border-line-strong bg-interactive text-on-interactive shadow-[var(--shadow-deep)]"
        >
          <WhatsAppGlyph size={28} />
        </a>
      </Tooltip>
    </div>
  );
}
