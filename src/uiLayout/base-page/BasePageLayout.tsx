import { Outlet } from 'react-router';
import { AppShell, Burger, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ReportProblemButton } from '@/app.Impl/flightRecorder/ReportProblemButton';

export function BasePageLayout() {
  const [navOpened, { toggle: toggleNav }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !navOpened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={navOpened} onClick={toggleNav} hiddenFrom="sm" size="sm" />
            <Text fw={700} c="blue">
              Fleetistics
            </Text>
          </Group>
          <ReportProblemButton />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" />

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
