import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/Button';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

type Mode = 'login' | 'register';

/** Iniciar sesión o crear una cuenta de visitante; lo usan el LoginModal y /acceso. */
export function AuthForms({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('login');
  const tab = (value: Mode, label: string) => (
    <Button type="button" size="sm" variant={mode === value ? 'secondary' : 'ghost'} aria-pressed={mode === value}
      onClick={() => setMode(value)}>
      {label}
    </Button>
  );

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label={t('auth.mode')} className="flex flex-wrap gap-2">
        {tab('login', t('auth.login'))}
        {tab('register', t('auth.createAccount'))}
      </div>
      <p className="m-0 text-step--1 text-fg-secondary">
        {mode === 'login' ? t('auth.loginHint') : t('auth.registerHint')}
      </p>
      {mode === 'login' ? <LoginForm onDone={onDone} /> : <RegisterForm onDone={onDone} />}
    </div>
  );
}
