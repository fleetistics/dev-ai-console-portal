import { IconHome2, IconUsers } from '@tabler/icons-react';
import { NavLink, Outlet, useNavigation } from 'react-router';
import { AppShell, Burger, Group, Progress, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { AppConfig } from '@/app.Impl/configs/AppConfig';
import { ReportProblemButton } from '@/app.Impl/flightRecorder/ReportProblemButton';

// The canonical nav list for the app shell. A new top-level page is one entry
// here — react-router's <NavLink> handles the active-route highlighting itself.
const NAV_LINKS = [
  { to: '/', label: 'Home', icon: IconHome2 },
  { to: '/users', label: 'Users', icon: IconUsers },
];

export function BasePageLayout() {
  const [navOpened, { toggle: toggleNav, close: closeNav }] = useDisclosure();
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
              {AppConfig.APP_NAME || 'Console'}
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

      <AppShell.Navbar p="md">
        {NAV_LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={closeNav}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--mantine-spacing-sm)',
              padding: 'var(--mantine-spacing-sm)',
              borderRadius: 'var(--mantine-radius-sm)',
              textDecoration: 'none',
              color: isActive ? 'var(--mantine-color-blue-7)' : 'var(--mantine-color-text)',
              backgroundColor: isActive ? 'var(--mantine-color-blue-0)' : undefined,
              fontWeight: isActive ? 600 : 400,
            })}
          >
            <Icon size={18} />
            <Text component="span" size="sm">
              {label}
            </Text>
          </NavLink>
        ))}
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
