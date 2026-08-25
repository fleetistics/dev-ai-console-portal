import { Outlet, useNavigation } from 'react-router';
import { AppShell, Burger, Group, Progress, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ReportProblemButton } from '@/app.Impl/flightRecorder/ReportProblemButton';

export function BasePageLayout() {
  const [navOpened, { toggle: toggleNav }] = useDisclosure();
  // Lazy routes (see Router.tsx) fetch their chunk before rendering, so this
  // covers both that fetch and any route loader — a blank click otherwise.
  const isNavigating = useNavigation().state !== 'idle';

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
        <Progress
          value={100}
          size={2}
          radius={0}
          animated
          style={{ opacity: isNavigating ? 1 : 0, transition: 'opacity 150ms' }}
        />
      </AppShell.Header>

      <AppShell.Navbar p="md" />

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
