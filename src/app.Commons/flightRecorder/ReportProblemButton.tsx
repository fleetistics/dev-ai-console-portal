import { useState } from 'react';
import { IconLifebuoy } from '@tabler/icons-react';
import { ActionIcon, Button, Group, Modal, Text, Textarea, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { reportProblem } from './index';

type SendState = 'idle' | 'sending' | 'sent' | 'failed';

/**
 * Header action that opens a dialog, takes an optional comment, and uploads the
 * retained client log (last 7 days) to the server. The upload is consent-explicit:
 * nothing is sent until the user presses the button.
 */
export function ReportProblemButton() {
  const [opened, { open, close }] = useDisclosure(false);
  const [comment, setComment] = useState('');
  const [state, setState] = useState<SendState>('idle');

  const handleOpen = () => {
    setState('idle');
    setComment('');
    open();
  };

  const handleSend = async () => {
    setState('sending');
    const ok = await reportProblem(comment.trim());
    setState(ok ? 'sent' : 'failed');
  };

  return (
    <>
      <Tooltip label="Report a problem">
        <ActionIcon variant="subtle" size="lg" aria-label="Report a problem" onClick={handleOpen}>
          <IconLifebuoy size={20} />
        </ActionIcon>
      </Tooltip>

      <Modal opened={opened} onClose={close} title="Report a problem" centered>
        {state === 'sent' ? (
          <>
            <Text size="sm" mb="md">
              Thank you! The report and diagnostic log were sent to our team.
            </Text>
            <Group justify="flex-end">
              <Button onClick={close}>Close</Button>
            </Group>
          </>
        ) : (
          <>
            <Text size="sm" c="dimmed" mb="sm">
              Describe what went wrong. Diagnostic data from this browser (application logs for up
              to the last 7 days) will be attached to help us investigate.
            </Text>
            <Textarea
              value={comment}
              onChange={(event) => setComment(event.currentTarget.value)}
              placeholder="What were you doing when the problem occurred?"
              minRows={4}
              autosize
              mb="md"
              data-autofocus
            />
            {state === 'failed' && (
              <Text size="sm" c="red" mb="sm">
                Sending failed. Please check your connection and try again.
              </Text>
            )}
            <Group justify="flex-end">
              <Button variant="default" onClick={close} disabled={state === 'sending'}>
                Cancel
              </Button>
              <Button onClick={handleSend} loading={state === 'sending'}>
                Send report
              </Button>
            </Group>
          </>
        )}
      </Modal>
    </>
  );
}
