import './chat.css';
import { useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useChatStore } from '../../store/chatStore';
import { ChatAvatar } from '../avatar/ChatAvatar';
import { Tooltip } from '../ui/Tooltip';
import { ChatPanel } from './ChatPanel';
import { placeKeyOf, useChatReactions } from './useChatReactions';

/**
 * Chat flotante de Mini Marie (§11.4.4): lanzador con ella saludando (foto de perfil animada) junto
 * al botón de WhatsApp y panel no modal. Escape o cerrar devuelven el foco.
 */
export function ChatWidget() {
  useChatReactions();
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const open = useChatStore((s) => s.open);
  const setOpen = useChatStore((s) => s.setOpen);
  const greet = useChatStore((s) => s.greet);
  const launcher = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const panelId = useId();
  const titleId = useId();

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  const openChat = () => {
    greet(placeKeyOf(pathname));
    setOpen(true);
  };
  const closeChat = () => {
    setOpen(false);
    launcher.current?.focus();
  };
  const label = open ? t('chat.launcherClose') : t('chat.launcherOpen');

  return (
    <>
      {open ? (
        <ChatPanel
          id={panelId}
          titleId={titleId}
          inputRef={input}
          onClose={closeChat}
          onNavigate={() => !isDesktop && setOpen(false)}
        />
      ) : null}
      <div className="fixed right-[5.25rem] bottom-4 z-40 md:right-[5.75rem] md:bottom-6">
        <Tooltip content={label} side="top" delay={300}>
          <button
            ref={launcher}
            type="button"
            onClick={open ? closeChat : openChat}
            aria-expanded={open}
            aria-controls={open ? panelId : undefined}
            aria-label={label}
            className="chat-launcher ui-pressable inline-flex size-14 items-center justify-center rounded-full border border-line-strong bg-surface shadow-[var(--shadow-deep)]"
          >
            <ChatAvatar size={48} />
          </button>
        </Tooltip>
      </div>
    </>
  );
}
