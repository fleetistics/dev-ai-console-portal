import { useState } from 'react';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useLoginMutation } from '@/app.Commons/userSession/userSessionApi';
import { AppConfig } from '@/app.Impl/configs/AppConfig';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FormValues = {
  UserName: string;
  Password: string;
  RememberMe: boolean;
};

export function LoginPage(props: { reloadSessionFunc?: () => void }) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [login, loginState] = useLoginMutation();
  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: { UserName: '', Password: '', RememberMe: false },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values).unwrap();
      // Re-runs the session check, which stores the token and swaps in the app UI.
      props.reloadSessionFunc?.();
    } catch {
      // Rendered below from loginState.error.
    }
  });

  const loginError = loginState.isError
    ? (loginState.error as { status?: unknown }).status === 401
      ? t('Invalid username or password')
      : t('Sign in failed — please try again')
    : undefined;

  return (
    <div className="w-[360px] rounded-lg border bg-card p-8 shadow-sm">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <p className="text-lg font-bold text-primary">{AppConfig.APP_NAME || t('Console')}</p>
          <p className="text-sm text-muted-foreground">{t('Development Console')}</p>
        </div>

        <h3 className="text-xl font-semibold">{t('Sign in')}</h3>

        <div className="space-y-1">
          <Label htmlFor="UserName">{t('Username')}</Label>
          <Input
            id="UserName"
            autoComplete="username"
            required
            {...register('UserName', { required: true })}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="Password">{t('Password')}</Label>
          <div className="relative">
            <Input
              id="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              className="pr-9"
              {...register('Password', { required: true })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t('Hide password') : t('Show password')}
              className="absolute inset-y-0 right-2 flex items-center text-muted-foreground"
            >
              {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox id="RememberMe" {...register('RememberMe')} />
            <Label htmlFor="RememberMe" className="font-normal">
              {t('Remember me')}
            </Label>
          </div>
          <a href="#" className="text-sm text-primary underline-offset-4 hover:underline">
            {t('Forgot password?')}
          </a>
        </div>

        {loginError && (
          <Alert variant="destructive">
            <AlertDescription>{loginError}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={loginState.isLoading}>
          {loginState.isLoading ? t('Signing in…') : t('Sign in')}
        </Button>
      </form>
    </div>
  );
}
