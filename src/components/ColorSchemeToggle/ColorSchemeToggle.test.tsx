import { render, screen, userEvent } from '@test-utils';
import { ColorSchemeToggle } from './ColorSchemeToggle';

describe('ColorSchemeToggle', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('switches to dark, then back to light, toggling the document class', async () => {
    const user = userEvent.setup();
    render(<ColorSchemeToggle />);

    await user.click(screen.getByRole('button', { name: 'Toggle color scheme' }));
    await user.click(screen.getByRole('menuitemradio', { name: /dark/i }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Toggle color scheme' }));
    await user.click(screen.getByRole('menuitemradio', { name: /light/i }));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('persists the chosen scheme so it survives a remount', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<ColorSchemeToggle />);

    await user.click(screen.getByRole('button', { name: 'Toggle color scheme' }));
    await user.click(screen.getByRole('menuitemradio', { name: /dark/i }));
    expect(localStorage.getItem('color-scheme')).toBe('dark');
    unmount();

    render(<ColorSchemeToggle />);
    await user.click(screen.getByRole('button', { name: 'Toggle color scheme' }));
    expect(screen.getByRole('menuitemradio', { name: /dark/i })).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });
});
