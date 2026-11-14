import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { LocalReply } from '../../lib/chatLocalReplies';
import type { ChatMessage } from '../../store/chatStore';
import { useTypewriter } from './useTypewriter';

interface ChatBubbleProps {
  message: ChatMessage;
  /** Solo los mensajes nuevos se escriben letra a letra. */
  animate: boolean;
  /** Al seguir una acción rápida (en móvil cierra el panel). */
  onNavigate: () => void;
}

/** Traduce los parámetros guardados como claves (módulo, sección). */
function resolveParams(t: TFunction, params: LocalReply['params'] = {}) {
  const values: Record<string, string> = { ...params };
  if (params.slug) values.name = t(`categories.${params.slug}.name`);
  if (params.placeKey) values.place = t(params.placeKey);
  return values;
}

/** Mensaje del usuario (derecha) o de Mini Marie (burbuja pixel, izquierda). */
export function ChatBubble({ message, animate, onNavigate }: ChatBubbleProps) {
  const { t } = useTranslation();
  if (message.from === 'user') {
    return (
      <div className="chat-msg max-w-[85%] self-end rounded-lg bg-interactive px-3 py-2 text-step--1 text-on-interactive">
        <span className="sr-only">{t('chat.you')}: </span>
        {message.text}
      </div>
    );
  }
  return <MarieBubble reply={message.reply} animate={animate} onNavigate={onNavigate} />;
}

interface MarieBubbleProps {
  reply: LocalReply;
  animate: boolean;
  onNavigate: () => void;
}

function MarieBubble({ reply, animate, onNavigate }: MarieBubbleProps) {
  const { t } = useTranslation();
  const text = t(reply.key, resolveParams(t, reply.params));
  const shown = useTypewriter(text, animate);
  const typing = shown.length < text.length;

  return (
    <div className="chat-msg pixel-bubble max-w-[90%] self-start text-step--1">
      <span className="sr-only">
        {t('chat.title')}: {text}
      </span>
      <p aria-hidden="true" className="whitespace-pre-line">
        {shown}
      </p>
      {reply.action && !typing ? (
        <Link
          to={reply.action.to}
          onClick={onNavigate}
          className="chat-action ui-pressable mt-2 inline-flex min-h-9 items-center rounded-md border border-line-strong px-3 text-step--1 text-accent no-underline"
        >
          {t('chat.go', { place: t(reply.action.labelKey) })}
        </Link>
      ) : null}
    </div>
  );
}
