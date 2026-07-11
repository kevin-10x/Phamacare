import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: null, logout: vi.fn() }),
}));

vi.mock('../../context/CartContext', () => ({
  useCart: () => ({ items: [], count: 0, subtotal: 0 }),
}));

import Navbar from '../Navbar';

describe('Navbar', () => {
  it('renders the brand', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
    expect(screen.getByText('Pharma')).toBeInTheDocument();
    expect(screen.getByText('Care')).toBeInTheDocument();
  });

  it('has Shop link', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
    expect(screen.getByText('Shop')).toBeInTheDocument();
  });

  it('shows Sign in when not authenticated', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('has a search input', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
    expect(screen.getByPlaceholderText(/Search medicines/i)).toBeInTheDocument();
  });
});
