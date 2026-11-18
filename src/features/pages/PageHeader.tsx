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
 * Encabezado de página: un solo h1 por ruta y título del documento. Editorial (D85) sobre una
 * banda amarilla de resalte (D96): regla de 1 px, la etiqueta en versalitas, el título en la
 * display y la descripción en serif cursiva, todo en negro.
 */
export function PageHeader({ title, description, eyebrow, emoji }: PageHeaderProps) {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = `${title} · ${t('app.shortTitle')}`;
  }, [title, t]);

  return (
    <header className="page-enter tone-papel flex flex-col gap-4 rounded-sm bg-mark px-5 py-8 md:px-10">
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
