import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { SequenceSprite } from '../../components/avatar/SequenceSprite';
import { WhatsAppGlyph } from '../../components/layout/WhatsAppGlyph';
import { Card } from '../../components/ui/Card';
import { whatsappUrl } from '../../lib/contact';

interface CreatorProfileSectionProps {
  /** Nivel del título de la tarjeta según dónde se use. */
  headingLevel?: 2 | 3;
  /** En el pie de página: Mini Marie se baja solo cuando el pie se acerca a la pantalla. */
  lazy?: boolean;
}

/**
 * Tarjeta "Perfil de la Creadora" (§11.5) con Mini Marie de pie, respirando (ciclo de 32 cuadros,
 * sprites32), y el contacto. Mini Marie va a escala entera como en el resto del sitio (D88):
 * 64 × 140 px, con su recurso doble o cuádruple.
 */
export function CreatorProfileSection({ headingLevel = 2, lazy = false }: CreatorProfileSectionProps) {
  const { t } = useTranslation();
  const Heading = `h${headingLevel}` as const;
  const titleId = useId();

  return (
    <Card as="section" aria-labelledby={titleId} className="flex flex-col gap-5 sm:flex-row">
      <span role="img" aria-label={t('creator.avatarAlt')} className="self-center leading-none sm:self-start">
        <SequenceSprite name="idle" size={140} lazy={lazy} />
      </span>
      <div className="flex flex-col gap-3">
        <p className="ui-eyebrow m-0 text-fg-muted">{t('creator.title')}</p>
        <Heading id={titleId} className="m-0 text-step-2 text-fg">
          {t('creator.name')}
        </Heading>
        <p className="m-0 max-w-prose text-fg-secondary">{t('creator.profile')}</p>
        <a
          href={whatsappUrl(t('whatsapp.message'))}
          target="_blank"
          rel="noopener noreferrer"
          className="ui-pressable ui-btn--primary inline-flex min-h-11 items-center gap-2 self-start rounded-sm border border-interactive bg-interactive px-4 font-medium whitespace-nowrap text-on-interactive no-underline"
        >
          <WhatsAppGlyph size={18} />
          {t('whatsapp.cta')}
          <span className="sr-only"> {t('whatsapp.newTab')}</span>
        </a>
        <p className="m-0 font-mono text-step--1 text-fg-muted">{t('creator.phone')}</p>
      </div>
    </Card>
  );
}
