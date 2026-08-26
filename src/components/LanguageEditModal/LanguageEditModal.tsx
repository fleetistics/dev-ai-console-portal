import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { getErrorMessage, getErrorTraceId } from '@/app.Commons/dataLayer/apiError';
import type { Language } from '@/app.Commons/i18n/translationTypes';
import { useCreateOrEnableLanguage } from '@/app.DataLayer/languages/languageApi';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type LanguageEditModalProps = {
  opened: boolean;
  /** Null means creating a new language. */
  language: Language | null;
  onClose: () => void;
};

type FormValues = Language;

const EMPTY_VALUES: FormValues = { Code: '', EnglishName: '', NativeName: '', IsEnabled: true };

const requiredLabel = (label: string) => (
  <>
    {label} <span className="text-red-600">*</span>
  </>
);

export function LanguageEditModal({ opened, language, onClose }: LanguageEditModalProps) {
  const { t } = useTranslation();
  const isCreating = language === null;
  const [createOrEnableLanguage, { isLoading, error }] = useCreateOrEnableLanguage();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    defaultValues: language ?? EMPTY_VALUES,
  });

  const onSubmit = handleSubmit(async (values) => {
    await createOrEnableLanguage({
      ...values,
      Code: values.Code.trim(),
      EnglishName: values.EnglishName.trim(),
      NativeName: values.NativeName.trim(),
    }).unwrap();
    onClose();
  });

  return (
    <Dialog open={opened} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isCreating ? t('Add language') : t('Edit language')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="space-y-1">
            <Label htmlFor="Code">{requiredLabel(t('Code'))}</Label>
            <Input
              id="Code"
              disabled={!isCreating}
              {...register('Code', { required: t('Code is required') })}
            />
            {errors.Code && <p className="text-destructive text-xs">{errors.Code.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="EnglishName">{requiredLabel(t('English Name'))}</Label>
            <Input
              id="EnglishName"
              {...register('EnglishName', { required: t('English Name is required') })}
            />
            {errors.EnglishName && (
              <p className="text-destructive text-xs">{errors.EnglishName.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="NativeName">{requiredLabel(t('Native Name'))}</Label>
            <Input
              id="NativeName"
              {...register('NativeName', { required: t('Native Name is required') })}
            />
            {errors.NativeName && (
              <p className="text-destructive text-xs">{errors.NativeName.message}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="IsEnabled"
              render={({ field }) => (
                <Checkbox id="IsEnabled" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            <Label htmlFor="IsEnabled" className="font-normal">
              {t('Enabled')}
            </Label>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>{t('Failed to save language')}</AlertTitle>
              <AlertDescription>
                {getErrorMessage(error)}
                {getErrorTraceId(error) && (
                  <p className="mt-1 text-xs">
                    {t('Support code')}: {getErrorTraceId(error)}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={isLoading || !isDirty}>
              {isLoading ? t('Saving…') : t('Save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
