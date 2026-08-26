import { Provider as ReduxProvider } from 'react-redux';
import { useTranslationUpdater } from '@/app.Commons/i18n/translationUpdater';
import { TooltipProvider } from '@/components/ui/tooltip';
import { store } from './app.Commons/dataLayer/store';
import { UserSessionProvider } from './app.Commons/userSession/userSessionProvider';
import { AppErrorBoundary } from './app.Impl/init-components/AppErrorBoundary';
import { Router } from './Router';
import './globals.css';

export default function App() {
  useTranslationUpdater();

  return (
    <TooltipProvider>
      <AppErrorBoundary>
        <ReduxProvider store={store}>
          <UserSessionProvider>
            <Router />
          </UserSessionProvider>
        </ReduxProvider>
      </AppErrorBoundary>
    </TooltipProvider>
  );
}
