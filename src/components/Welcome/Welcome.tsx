import { useTranslation } from 'react-i18next';
import { AppConfig } from '@/app.Impl/configs/AppConfig';

export function Welcome() {
  const { t } = useTranslation();

  return (
    <>
      <h1 className="mt-24 text-center text-4xl font-bold">
        {t('Welcome to')}{' '}
        <span className="bg-gradient-to-r from-pink-500 to-amber-400 bg-clip-text text-transparent">
          {AppConfig.APP_NAME || t('the Console')}
        </span>
      </h1>
      <p className="mx-auto mt-8 max-w-xl text-center text-lg text-muted-foreground">
        {t('Use the navigation to manage users and other resources.')}
      </p>
    </>
  );
}
