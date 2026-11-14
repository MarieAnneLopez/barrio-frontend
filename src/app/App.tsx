import { useTranslation } from 'react-i18next';

export function App() {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-xs tracking-[0.2em] text-[#8AB4F8]/70 uppercase">
        {t('app.location')}
      </p>
      <h1 className="text-4xl font-semibold text-white">{t('app.title')}</h1>
      <p className="max-w-prose text-[#8AB4F8]">{t('app.tagline')}</p>
    </main>
  );
}
