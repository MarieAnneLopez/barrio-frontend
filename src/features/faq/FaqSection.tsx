import { useTranslation } from 'react-i18next';
import { Accordion } from '../../components/ui/Accordion';
import { FAQ_KEYS } from './faqKeys';

interface FaqSectionProps {
  headingLevel?: 2 | 3 | 4;
  /** Cuántas preguntas mostrar (el footer muestra un resumen). */
  limit?: number;
}

/** Preguntas frecuentes en acordeón accesible. */
export function FaqSection({ headingLevel = 2, limit = FAQ_KEYS.length }: FaqSectionProps) {
  const { t } = useTranslation();
  const items = FAQ_KEYS.slice(0, limit).map((key) => ({
    id: key,
    title: t(`faq.items.${key}.q`),
    content: <p className="m-0">{t(`faq.items.${key}.a`)}</p>,
  }));
  return <Accordion items={items} headingLevel={headingLevel} />;
}
