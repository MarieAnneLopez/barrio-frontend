import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface PageHeaderProps {
  title: string;
  description: string;
  /** Micro-etiqueta superior (p. ej. "Módulo 3"). */
  eyebrow?: string;
  /** Emoji decorativo de la categoría. */
  emoji?: string;
}

/** Encabezado de página: un solo h1 por ruta y título del documento. */
export function PageHeader({ title, description, eyebrow, emoji }: PageHeaderProps) {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = `${title} · ${t('app.shortTitle')}`;
  }, [title, t]);

  return (
    <header className="flex max-w-3xl flex-col gap-3">
      {eyebrow ? (
        <p className="m-0 font-mono text-step--1 tracking-[0.2em] text-fg-muted uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="m-0 flex items-center gap-3 text-step-3 text-fg">
        {emoji ? <span aria-hidden="true">{emoji}</span> : null}
        {title}
      </h1>
      <p className="m-0 max-w-prose text-step-1 text-fg-secondary">{description}</p>
    </header>
  );
}
