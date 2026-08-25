import { SubmitEvent, useState } from 'react';
import {
  Alert,
  Anchor,
  Button,
  Checkbox,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useLoginMutation } from '@/app.Commons/userSession/userSessionApi';
import { AppConfig } from '@/app.Impl/configs/AppConfig';

export function LoginPage(props: { reloadSessionFunc?: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [login, loginState] = useLoginMutation();

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await login({ UserName: username, Password: password, RememberMe: rememberMe }).unwrap();
      // Re-runs the session check, which stores the token and swaps in the app UI.
      props.reloadSessionFunc?.();
    } catch {
      // Rendered below from loginState.error.
    }
  };

  const loginError = loginState.isError
    ? (loginState.error as { status?: unknown }).status === 401
      ? 'Invalid username or password'
      : 'Sign in failed — please try again'
    : undefined;

  return (
    <Paper withBorder shadow="sm" radius="md" p="xl" w={360}>
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <div>
            <Text fw={700} size="lg" c="blue">
              {AppConfig.APP_NAME || 'Console'}
            </Text>
            <Text size="sm" c="dimmed">
              Development Console
            </Text>
          </div>

          <Title order={3}>Sign in</Title>

          <TextInput
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
            autoComplete="username"
            required
          />

          <PasswordInput
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            autoComplete="current-password"
            required
          />

          <Group justify="space-between">
            <Checkbox
              label="Remember me"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.currentTarget.checked)}
            />
            <Anchor href="#" size="sm">
              Forgot password?
            </Anchor>
          </Group>

          {loginError && (
            <Alert color="red" variant="light">
              {loginError}
            </Alert>
          )}

          <Button type="submit" fullWidth loading={loginState.isLoading}>
            Sign in
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
