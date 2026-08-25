import '@mantine/core/styles.css';
import 'mantine-react-table/styles.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as ReduxProvider } from 'react-redux';
import { MantineProvider } from '@mantine/core';
import { store } from './app.Commons/dataLayer/store';
import { UserSessionProvider } from './app.Commons/userSession/userSessionProvider';
import { Router } from './Router';
import { theme } from './theme';

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
