import { useTranslation } from 'react-i18next';
import { useChatStore } from '../../store/chatStore';

const DEFAULTS = ['q1', 'q2', 'q3', 'q4'] as const;

/** Chips de preguntas: las que sugiere la última respuesta del servidor o, si no hay, las fijas. */
export function ChatSuggestions({ onPick }: { onPick: (text: string) => void }) {
  const { t } = useTranslation();
  const pending = useChatStore((s) => s.pending);
  const last = useChatStore((s) => [...s.messages].reverse().find((m) => 'remote' in m));
  const remote = last && 'remote' in last ? last.remote.sugerencias : [];
  const items = remote.length ? remote.slice(0, 4) : DEFAULTS.map((key) => t(`chat.suggested.${key}`));

  return (
    <div role="group" aria-label={t('chat.suggestions')} className="flex gap-2 overflow-x-auto px-3 pb-2">
      {items.map((text) => (
        <button
          key={text}
          type="button"
          disabled={pending}
          onClick={() => onPick(text)}
          className="ui-pressable shrink-0 rounded-full border border-line-strong px-3 py-1.5 text-step--2 text-fg-secondary"
        >
          {text}
        </button>
      ))}
    </div>
  );
}
