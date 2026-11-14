import { useId, useState, type ReactNode } from 'react';

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  /** Permite varios abiertos a la vez. */
  multiple?: boolean;
  headingLevel?: 2 | 3 | 4;
}

/** Acordeón (patrón WAI-ARIA): botón con aria-expanded que controla una región. */
export function Accordion({ items, multiple = false, headingLevel = 3 }: AccordionProps) {
  const baseId = useId();
  const [open, setOpen] = useState<Set<string>>(new Set());
  const Heading = `h${headingLevel}` as const;

  const toggle = (id: string) =>
    setOpen((current) => {
      const next = new Set(multiple ? current : []);
      if (current.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="divide-y divide-line rounded-lg border border-line bg-surface">
      {items.map((item) => {
        const expanded = open.has(item.id);
        const buttonId = `${baseId}-${item.id}-button`;
        const panelId = `${baseId}-${item.id}-panel`;
        return (
          <div key={item.id}>
            <Heading className="m-0 text-step-0">
              <button
                id={buttonId}
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className="ui-pressable ui-btn--ghost flex min-h-11 w-full items-center justify-between gap-4 px-4 py-3 text-left font-medium text-fg"
              >
                {item.title}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  className={`shrink-0 text-accent transition-transform duration-[var(--dur-2)] ease-out ${expanded ? 'rotate-180' : ''}`}
                >
                  <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
            </Heading>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!expanded}
              className="px-4 pb-4 text-step-0 text-fg-secondary"
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
