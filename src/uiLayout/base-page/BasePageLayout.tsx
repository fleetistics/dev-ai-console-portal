import { AppShell, Burger, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet } from 'react-router';

export function BasePageLayout() {
  const [navOpened, { toggle: toggleNav }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !navOpened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={navOpened} onClick={toggleNav} hiddenFrom="sm" size="sm" />
          <Text fw={700} c="blue">
            Fleetistics
          </Text>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md" />

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
