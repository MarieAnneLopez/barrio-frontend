import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { SectionIntro } from '../../components/intro/SectionIntro';

interface PageHeaderProps {
  title: string;
  description: string;
  /** Micro-etiqueta superior (p. ej. "Módulo 3"). */
  eyebrow?: string;
  /** Emoji decorativo de la categoría. */
  emoji?: string;
}

/**
 * Encabezado de página: un solo h1 por ruta y título del documento. Es la entrada animada de la
 * sección (D101, SectionIntro), montada con la ruta como clave para reproducirse una vez en cada
 * entrada, también al pasar de un módulo a otro sin cambiar de componente.
 */
export function PageHeader({ title, description, eyebrow, emoji }: PageHeaderProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = `${title} · ${t('app.shortTitle')}`;
  }, [title, t]);

  return <SectionIntro key={pathname} title={title} description={description} eyebrow={eyebrow} emoji={emoji} />;
}
