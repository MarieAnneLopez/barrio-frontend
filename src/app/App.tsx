import { useTranslation } from 'react-i18next';

export function App() {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-step--1 tracking-[0.2em] text-fg-muted uppercase">
        {t('app.location')}
      </p>
      <h1 className="text-step-4 font-bold text-fg">{t('app.title')}</h1>
      <p className="max-w-prose text-step-1 text-fg-secondary">{t('app.tagline')}</p>
    </main>
  );
}
