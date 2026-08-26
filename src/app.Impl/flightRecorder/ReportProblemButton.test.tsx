import { render, screen, userEvent } from '@test-utils';
import { ReportProblemButton } from './ReportProblemButton';

const { reportProblem } = vi.hoisted(() => ({ reportProblem: vi.fn() }));
vi.mock('./index', () => ({ reportProblem }));

describe('ReportProblemButton', () => {
  afterEach(() => {
    reportProblem.mockReset();
  });

  it('opens the dialog, sends the comment, and shows a confirmation', async () => {
    reportProblem.mockResolvedValue(true);
    const user = userEvent.setup();
    render(<ReportProblemButton />);

    await user.click(screen.getByRole('button', { name: 'Report a problem' }));
    await user.type(screen.getByPlaceholderText(/what were you doing/i), 'it crashed');
    await user.click(screen.getByRole('button', { name: 'Send report' }));

    expect(await screen.findByText(/sent to our team/i)).toBeInTheDocument();
    expect(reportProblem).toHaveBeenCalledWith('it crashed');
  });

  it('shows an error and keeps the dialog open when sending fails', async () => {
    reportProblem.mockResolvedValue(false);
    const user = userEvent.setup();
    render(<ReportProblemButton />);

    await user.click(screen.getByRole('button', { name: 'Report a problem' }));
    await user.click(screen.getByRole('button', { name: 'Send report' }));

    expect(await screen.findByText(/sending failed/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send report' })).toBeInTheDocument();
  });

  it('resets state when reopened after a previous send', async () => {
    reportProblem.mockResolvedValue(true);
    const user = userEvent.setup();
    render(<ReportProblemButton />);

    await user.click(screen.getByRole('button', { name: 'Report a problem' }));
    await user.click(screen.getByRole('button', { name: 'Send report' }));
    await screen.findByText(/sent to our team/i);
    await user.click(screen.getByRole('button', { name: 'Close' }));

    await user.click(screen.getByRole('button', { name: 'Report a problem' }));
    expect(screen.getByRole('button', { name: 'Send report' })).toBeInTheDocument();
    expect(screen.queryByText(/sent to our team/i)).not.toBeInTheDocument();
  });
});
