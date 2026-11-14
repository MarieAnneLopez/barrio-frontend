import './chat.css';
import { useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useAvatarStore } from '../../store/avatarStore';
import { useChatStore } from '../../store/chatStore';
import { AvatarSprite } from '../avatar/AvatarSprite';
import { Tooltip } from '../ui/Tooltip';
import { ChatPanel } from './ChatPanel';
import { placeKeyOf, useChatReactions } from './useChatReactions';

/**
 * Chat flotante de Mini Marie (§11.4.4): lanzador con el avatar en vivo junto
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
  const avatar = useAvatarStore((s) => s.state);
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
            className="chat-launcher ui-pressable inline-flex size-14 items-end justify-center rounded-full border border-line-strong bg-surface pb-1 shadow-[var(--shadow-deep)]"
          >
            <AvatarSprite state={avatar} height={44} />
          </button>
        </Tooltip>
      </div>
    </>
  );
}
