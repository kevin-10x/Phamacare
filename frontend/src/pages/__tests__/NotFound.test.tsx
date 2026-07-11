import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotFound from '../NotFound';

describe('NotFound', () => {
  it('renders 404 message', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );
    expect(screen.getByText(/Page not found/i)).toBeInTheDocument();
  });

  it('has a link back to home', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );
    const link = screen.getByText(/Back to home/i);
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/');
  });
});
