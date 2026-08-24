import { SubmitEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FetchError, ofetch } from 'ofetch';
import {
  Alert,
  Anchor,
  Button,
  Checkbox,
  Divider,
  Group,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { USER_SESSION_LOGIN_URI } from '@/app.Commons/userSession/userSessionConst';
import { LoginData } from '@/app.Commons/userSession/userSessionDto';
import { AppConfig } from '@/app.Impl/configs/AppConfig';

const api = ofetch.create({
  baseURL: AppConfig.BASE_URL,
  credentials: 'include',
});

export function LoginPage(props: { reloadSessionFunc?: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const loginMutation = useMutation({
    mutationFn: () =>
      api(USER_SESSION_LOGIN_URI, {
        method: 'POST',
        body: { UserName: username, Password: password, RememberMe: rememberMe } as LoginData,
      }),
    onSuccess: () => props.reloadSessionFunc?.(),
  });

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    loginMutation.mutate();
  };

  const loginError = loginMutation.isError
    ? (loginMutation.error as FetchError).status === 401
      ? 'Invalid username or password'
      : 'Sign in failed — please try again'
    : undefined;

  return (
    <Paper withBorder shadow="sm" radius="md" p="xl" w={360}>
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <div>
            <Text fw={700} size="lg" c="blue">
              Fleetistics
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

          <Button type="submit" fullWidth loading={loginMutation.isPending}>
            Sign in
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
