import { Component, type ErrorInfo, type ReactNode } from 'react';
import { log, reportCrash } from '@/app.Impl/flightRecorder';
import { InitError } from './init-error';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render errors that occur outside the router (in the provider tree —
 * Redux, the user-session check, or a bug in a layout itself). Route-level
 * render errors are already handled by RouterErrorPage; this is the backstop
 * so a bug above the router doesn't white-screen the app.
 *
 * Class component because error boundaries are not yet expressible with hooks
 * (no useErrorBoundary equivalent in React as of this writing).
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    log.error('react', error.message, { error, componentStack: info.componentStack });
    reportCrash('crash');
  }

  private handleRetry = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <InitError
          title="Something went wrong"
          errorMsg={this.state.error.message}
          retryFunc={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}
