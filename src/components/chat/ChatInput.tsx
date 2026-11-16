import { useId, useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { NavIcon } from '../layout/NavIcon';

interface ChatInputProps {
  onSend: (text: string) => void;
  inputRef: RefObject<HTMLInputElement>;
}

/** Campo del chat: etiqueta para lectores de pantalla, Enter envía. */
export function ChatInput({ onSend, inputRef }: ChatInputProps) {
  const { t } = useTranslation();
  const id = useId();
  const [value, setValue] = useState('');
  const empty = value.trim() === '';

  return (
    <form
      className="flex items-center gap-2 border-t border-line p-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (empty) return;
        onSend(value);
        setValue('');
      }}
    >
      <label htmlFor={id} className="sr-only">
        {t('chat.inputLabel')}
      </label>
      <input
        ref={inputRef}
        id={id}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        maxLength={300}
        autoComplete="off"
        placeholder={t('chat.placeholder')}
        className="ui-field min-h-11 min-w-0 flex-1 rounded-sm border border-ink bg-stone px-3 text-step--1 text-on-stone placeholder:text-on-stone placeholder:opacity-80"
      />
      <button
        type="submit"
        disabled={empty}
        aria-label={t('chat.send')}
        className="ui-pressable ui-btn--primary inline-flex size-11 shrink-0 items-center justify-center rounded-md border border-interactive bg-interactive text-on-interactive disabled:opacity-50"
      >
        <NavIcon name="send" />
      </button>
    </form>
  );
}
