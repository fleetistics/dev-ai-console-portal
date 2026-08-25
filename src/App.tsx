import '@mantine/core/styles.css';
import 'mantine-react-table/styles.css';

import { Provider as ReduxProvider } from 'react-redux';
import { MantineProvider } from '@mantine/core';
import { store } from './app.Commons/dataLayer/store';
import { UserSessionProvider } from './app.Commons/userSession/userSessionProvider';
import { Router } from './Router';
import { theme } from './theme';

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <ReduxProvider store={store}>
        <UserSessionProvider>
          <Router />
        </UserSessionProvider>
      </ReduxProvider>
    </MantineProvider>
  );
}
