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
 * Encabezado de página: un solo h1 por ruta y título del documento. Es la «placa»
 * rosa de la v2 (D68): texto vino (5,16), borde y sombra de ladrillo.
 */
export function PageHeader({ title, description, eyebrow, emoji }: PageHeaderProps) {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = `${title} · ${t('app.shortTitle')}`;
  }, [title, t]);

  return (
    <header className="plate-enter band-rosa flex max-w-4xl flex-col gap-3 rounded-sm border-2 border-ink p-6 shadow-[var(--shadow-brick)] md:p-8">
      {eyebrow ? (
        <p className="eyebrow m-0 text-on-pink">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="m-0 flex items-center gap-3 text-step-4 text-on-pink">
        {emoji ? <span aria-hidden="true">{emoji}</span> : null}
        {title}
      </h1>
      <p className="m-0 max-w-prose text-step-1 text-on-pink">{description}</p>
    </header>
  );
}
