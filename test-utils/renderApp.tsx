import { render as testingLibraryRender } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { TooltipProvider } from '@/components/ui/tooltip';
import { makeStore } from '../src/app.Commons/dataLayer/store';

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
        <TooltipProvider>
          <ReduxProvider store={store}>{children}</ReduxProvider>
        </TooltipProvider>
      ),
    }),
  };
}
