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

/**
 * Encabezado de página: un solo h1 por ruta y título del documento. Editorial (D84, D85): sin
 * placa, una regla ámbar de 1 px, la etiqueta en versalitas, el título en la display y la
 * descripción en serif cursiva, todo directo sobre el fondo.
 */
export function PageHeader({ title, description, eyebrow, emoji }: PageHeaderProps) {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = `${title} · ${t('app.shortTitle')}`;
  }, [title, t]);

  return (
    <header className="page-enter flex max-w-4xl flex-col gap-4">
      <span aria-hidden="true" className="ui-rule" />
      {eyebrow ? <p className="ui-eyebrow m-0 text-fg-muted">{eyebrow}</p> : null}
      <h1 className="m-0 flex items-center gap-3 text-step-5 text-fg">
        {emoji ? <span aria-hidden="true">{emoji}</span> : null}
        {title}
      </h1>
      <p className="m-0 max-w-prose font-serif text-step-2 font-medium text-fg-secondary italic">{description}</p>
    </header>
  );
}
