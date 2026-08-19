import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as ReduxProvider } from 'react-redux';
import { Router } from './Router';
import { theme } from './theme';
import { store } from './app.Commons/dataLayer/store';
import { UserSessionProvider } from './app.Commons/userSession/userSessionProvider';

const queryClient = new QueryClient();

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <ReduxProvider store={store}>
        <QueryClientProvider client={queryClient}>
          <UserSessionProvider>
            <Router />
          </UserSessionProvider>
        </QueryClientProvider>
      </ReduxProvider>
    </MantineProvider>
  );
}
