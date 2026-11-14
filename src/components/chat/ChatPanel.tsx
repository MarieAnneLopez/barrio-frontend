import { useEffect, useRef, useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useAvatarStore } from '../../store/avatarStore';
import { useChatStore } from '../../store/chatStore';
import { AvatarSprite } from '../avatar/AvatarSprite';
import { NavIcon } from '../layout/NavIcon';
import { ChatBubble } from './ChatBubble';
import { ChatInput } from './ChatInput';

const SUGGESTIONS = ['q1', 'q2', 'q3', 'q4'] as const;

interface ChatPanelProps {
  id: string;
  titleId: string;
  inputRef: RefObject<HTMLInputElement>;
  onClose: () => void;
  onNavigate: () => void;
}

/** Panel del chat sobre --bg-surface (legible sobre cualquier fondo): cabecera pixel, conversación, sugerencias y campo. */
export function ChatPanel({ id, titleId, inputRef, onClose, onNavigate }: ChatPanelProps) {
  const { t } = useTranslation();
  const messages = useChatStore((s) => s.messages);
  const send = useChatStore((s) => s.send);
  const avatar = useAvatarStore((s) => s.state);
  const reduced = useReducedMotion();
  const log = useRef<HTMLDivElement>(null);
  // Mensajes ya existentes al abrir no se vuelven a escribir letra a letra.
  const [firstNewId] = useState(() => (messages.at(-1)?.id ?? 0) + 1);

  useEffect(() => {
    const node = log.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages]);

  return (
    <section
      id={id}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      onKeyDown={(event) => event.key === 'Escape' && onClose()}
      className="chat-panel fixed inset-x-2 top-[4.5rem] bottom-[5.5rem] z-50 flex flex-col overflow-hidden rounded-lg border border-line-strong bg-surface shadow-[var(--shadow-deep)] md:top-auto md:right-24 md:bottom-24 md:left-auto md:h-[min(560px,calc(100dvh-8rem))] md:w-[380px]"
    >
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <AvatarSprite state={avatar} height={44} />
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="pixel-font text-step--1 text-fg">
            {t('chat.title')}
          </h2>
          <p className="text-step--2 leading-tight text-fg-muted">{t('chat.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('chat.close')}
          className="ui-pressable ui-btn--ghost inline-flex size-11 items-center justify-center rounded-md border border-transparent text-fg-secondary"
        >
          <NavIcon name="close" />
        </button>
      </div>
      <div
        ref={log}
        role="log"
        tabIndex={0}
        aria-label={t('chat.log')}
        className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
      >
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            message={message}
            animate={!reduced && message.id >= firstNewId}
            onNavigate={onNavigate}
          />
        ))}
      </div>
      <div role="group" aria-label={t('chat.suggestions')} className="flex gap-2 overflow-x-auto px-3 pb-2">
        {SUGGESTIONS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => send(t(`chat.suggested.${key}`))}
            className="ui-pressable shrink-0 rounded-full border border-line-strong px-3 py-1.5 text-step--2 text-fg-secondary"
          >
            {t(`chat.suggested.${key}`)}
          </button>
        ))}
      </div>
      <ChatInput onSend={send} inputRef={inputRef} />
    </section>
  );
}
