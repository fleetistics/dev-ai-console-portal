import { render, screen, userEvent } from '@test-utils';
import { log, reportCrash } from '@/app.Impl/flightRecorder';
import { AppErrorBoundary } from './AppErrorBoundary';

vi.mock('@/app.Impl/flightRecorder', () => ({
  log: { error: vi.fn() },
  reportCrash: vi.fn(),
}));

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('boom');
  }
  return <div>safe content</div>;
}

describe('AppErrorBoundary', () => {
  // React logs the caught error to console.error too; expected here, so silence it.
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('renders children when nothing throws', () => {
    render(
      <AppErrorBoundary>
        <Bomb shouldThrow={false} />
      </AppErrorBoundary>
    );

    expect(screen.getByText('safe content')).toBeInTheDocument();
  });

  it('renders a fallback and reports the crash when a child throws', () => {
    render(
      <AppErrorBoundary>
        <Bomb shouldThrow />
      </AppErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('boom')).toBeInTheDocument();
    expect(log.error).toHaveBeenCalledWith('react', 'boom', expect.objectContaining({}));
    expect(reportCrash).toHaveBeenCalledWith('crash');
  });

  it('lets the user retry, re-rendering children if the error is gone', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <AppErrorBoundary>
        <Bomb shouldThrow />
      </AppErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Fix the underlying condition, then let the user retry.
    rerender(
      <AppErrorBoundary>
        <Bomb shouldThrow={false} />
      </AppErrorBoundary>
    );
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('safe content')).toBeInTheDocument();
  });
});
