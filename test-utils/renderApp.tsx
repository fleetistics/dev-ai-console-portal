import { render as testingLibraryRender } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { MantineProvider } from '@mantine/core';
import { makeStore } from '../src/app.Commons/dataLayer/store';
import { theme } from '../src/theme';

/**
 * Renders connected UI (pages, anything using RTK Query hooks) with the full provider
 * stack and a FRESH Redux store, so query-cache state never bleeds between tests.
 * Pair with installApiMock() to control what the API "returns".
 *
 * For pure presentational components, the plain `render` from @test-utils is enough.
 */
export function renderApp(ui: React.ReactNode) {
  const store = makeStore();
  return {
    store,
    ...testingLibraryRender(ui, {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <MantineProvider theme={theme} env="test">
          <ReduxProvider store={store}>{children}</ReduxProvider>
        </MantineProvider>
      ),
    }),
  };
}
