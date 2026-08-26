import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { getErrorMessage, getErrorTraceId } from '@/app.Commons/dataLayer/apiError';
import type { TranslationTokenAdmin } from '@/app.Commons/i18n/translationTypes';
import { useSetTranslation } from '@/app.DataLayer/translations/translationAdminApi';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type TranslationEditModalProps = {
  opened: boolean;
  lang: string;
  token: TranslationTokenAdmin | null;
  onClose: () => void;
};

type FormValues = { Translation: string };

export function TranslationEditModal({ opened, lang, token, onClose }: TranslationEditModalProps) {
  const { t } = useTranslation();
  const [setTranslation, { isLoading, error }] = useSetTranslation();

  const {
    register,
    handleSubmit,
    formState: { isDirty },
  } = useForm<FormValues>({
    defaultValues: { Translation: token?.Translation ?? '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!token) {
      return;
    }
    const translatedText = values.Translation.trim() === '' ? null : values.Translation;
    await setTranslation({ lang, tokenId: token.TokenId, translatedText }).unwrap();
    onClose();
  });

  return (
    <Dialog open={opened} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('Edit translation')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="space-y-1">
            <Label>{t('Text')}</Label>
            <p className="text-sm">{token?.Text}</p>
          </div>

          {token?.Context && (
            <div className="space-y-1">
              <Label>{t('Context')}</Label>
              <p className="text-muted-foreground text-sm">{token.Context}</p>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="Translation">{t('Translation')}</Label>
            <Input id="Translation" {...register('Translation')} />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>{t('Failed to save translation')}</AlertTitle>
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
