import { useState } from 'react';
import { IconLifebuoy } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { reportProblem } from './index';

type SendState = 'idle' | 'sending' | 'sent' | 'failed';

/**
 * Header action that opens a dialog, takes an optional comment, and uploads the
 * retained client log (last 7 days) to the server. The upload is consent-explicit:
 * nothing is sent until the user presses the button.
 */
export function ReportProblemButton() {
  const { t } = useTranslation();
  const [opened, setOpened] = useState(false);
  const [comment, setComment] = useState('');
  const [state, setState] = useState<SendState>('idle');

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setState('idle');
      setComment('');
    }
    setOpened(next);
  };

  const handleSend = async () => {
    setState('sending');
    const ok = await reportProblem(comment.trim());
    setState(ok ? 'sent' : 'failed');
  };

  return (
    <Dialog open={opened} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t('Report a problem')}>
              <IconLifebuoy size={20} />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>{t('Report a problem')}</TooltipContent>
      </Tooltip>

      {/* showCloseButton=false: the footer's own Cancel/Close buttons already cover
          dismissal in both states — Radix's default corner X would be a second,
          redundant "Close" control (and its accessible name collides exactly with
          the footer Close button in the "sent" state). */}
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t('Report a problem')}</DialogTitle>
        </DialogHeader>

        {state === 'sent' ? (
          <>
            <p className="text-sm">
              {t('Thank you! The report and diagnostic log were sent to our team.')}
            </p>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>{t('Close')}</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {t(
                'Describe what went wrong. Diagnostic data from this browser (application logs for up to the last 7 days) will be attached to help us investigate.'
              )}
            </p>
            <Textarea
              value={comment}
              onChange={(event) => setComment(event.currentTarget.value)}
              placeholder={t('What were you doing when the problem occurred?')}
              rows={4}
              autoFocus
            />
            {state === 'failed' && (
              <p className="text-sm text-destructive">
                {t('Sending failed. Please check your connection and try again.')}
              </p>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={state === 'sending'}
              >
                {t('Cancel')}
              </Button>
              <Button onClick={handleSend} disabled={state === 'sending'}>
                {state === 'sending' ? t('Sending…') : t('Send report')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
