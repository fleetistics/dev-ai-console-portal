import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { InitAppBackground } from './init-app-background';

export function InitError(props: { title?: string; errorMsg?: string; retryFunc?: () => void }) {
  const { t } = useTranslation();

  return (
    <InitAppBackground>
      <div className="flex flex-col items-center gap-2">
        <p className="font-bold text-red-600">{props.title ?? t('Operation failed')}</p>
        {props.errorMsg && <p>{props.errorMsg}</p>}
        {props.retryFunc && <Button onClick={props.retryFunc}>{t('Try again')}</Button>}
      </div>
    </InitAppBackground>
  );
}
