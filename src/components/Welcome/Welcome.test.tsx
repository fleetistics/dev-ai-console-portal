import { render, screen } from '@test-utils';
import { Welcome } from './Welcome';

describe('Welcome component', () => {
  it('renders a welcome heading', () => {
    render(<Welcome />);
    expect(screen.getByRole('heading', { name: /welcome to/i })).toBeInTheDocument();
  });
});
