import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { WhatsAppGlyph } from '../../components/layout/WhatsAppGlyph';
import { Card } from '../../components/ui/Card';
import { whatsappUrl } from '../../lib/contact';

interface CreatorProfileSectionProps {
  /** Nivel del título de la tarjeta según dónde se use. */
  headingLevel?: 2 | 3;
}

/** Tarjeta "Perfil de la Creadora" (§11.5) con avatar pixel y contacto. */
export function CreatorProfileSection({ headingLevel = 2 }: CreatorProfileSectionProps) {
  const { t } = useTranslation();
  const Heading = `h${headingLevel}` as const;
  const titleId = useId();

  return (
    <Card as="section" aria-labelledby={titleId} className="flex flex-col gap-5 sm:flex-row">
      <img
        src="/assets/avatar/frame_1.png"
        alt={t('creator.avatarAlt')}
        width={256}
        height={558}
        loading="lazy"
        className="pixel-art h-[140px] w-auto self-center sm:self-start"
      />
      <div className="flex flex-col gap-3">
        <p className="m-0 font-mono text-step--1 tracking-[0.16em] text-fg-muted uppercase">
          {t('creator.title')}
        </p>
        <Heading id={titleId} className="m-0 text-step-2 text-fg">
          {t('creator.name')}
        </Heading>
        <p className="m-0 max-w-prose text-fg-secondary">{t('creator.profile')}</p>
        <a
          href={whatsappUrl(t('whatsapp.message'))}
          target="_blank"
          rel="noopener noreferrer"
          className="ui-pressable ui-btn--primary inline-flex min-h-11 items-center gap-2 self-start rounded-md border border-interactive bg-interactive px-4 font-medium whitespace-nowrap text-on-interactive no-underline"
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
