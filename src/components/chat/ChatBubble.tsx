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

interface QuickAction {
  to: string;
  label: string;
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
      <div className="chat-msg max-w-[85%] self-end rounded-lg bg-strong px-3 py-2 text-step--1 text-on-pink">
        <span className="sr-only">{t('chat.you')}: </span>
        {message.text}
      </div>
    );
  }
  if ('remote' in message) {
    // El texto viene del servidor y se muestra como texto (React lo escapa): nunca como HTML.
    const actions = message.remote.acciones.map((a) => ({ to: a.ruta, label: a.etiqueta }));
    return <MarieBubble text={message.remote.texto} actions={actions} animate={animate} onNavigate={onNavigate} sources={message.remote.fuentes} />;
  }
  const { reply } = message;
  const actions = reply.action ? [{ to: reply.action.to, label: t(reply.action.labelKey) }] : [];
  return (
    <MarieBubble text={[t(reply.key, resolveParams(t, reply.params)), ...(reply.limited ? [t('chat.replies.limit')] : [])].join('\n')} actions={actions} animate={animate}
      onNavigate={onNavigate} sources={reply.sources} />
  );
}

interface MarieBubbleProps {
  text: string;
  actions: QuickAction[];
  animate: boolean;
  onNavigate: () => void;
  sources?: { titulo: string; url: string; consultado_en: string }[] | undefined;
}

function MarieBubble({ text, actions, animate, onNavigate, sources = [] }: MarieBubbleProps) {
  const { t } = useTranslation();
  const shown = useTypewriter(text, animate);
  const typing = shown.length < text.length;

  return (
    <div className="chat-msg ui-card max-w-[90%] self-start px-4 py-3 text-step--1">
      <span className="sr-only">{t('chat.title')}: {text}</span>
      <p aria-hidden="true" className="whitespace-pre-line">{shown}</p>
      {!typing && sources.length ? <ul aria-label={t('chat.sources')}>
        {sources.filter((source) => /^https:\/\//i.test(source.url)).map((source) => (
          <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.titulo}</a>
            {' · '}{t('chat.consulted', { date: source.consultado_en })}</li>
        ))}
      </ul> : null}
      {!typing && actions.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {actions.map((action) => (
            <Link key={action.to} to={action.to} onClick={onNavigate}
              className="chat-action ui-pressable inline-flex min-h-9 items-center rounded-md border border-line-strong px-3 text-step--1 text-accent no-underline">
              {t('chat.go', { place: action.label })}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
