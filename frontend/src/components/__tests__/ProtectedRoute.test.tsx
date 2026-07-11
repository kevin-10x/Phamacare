import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

import ProtectedRoute from '../ProtectedRoute';

describe('ProtectedRoute', () => {
  it('does not render children when not authenticated', () => {
    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });
});
