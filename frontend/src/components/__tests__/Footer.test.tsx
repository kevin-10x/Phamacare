import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from '../Footer';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));

vi.mock('../../context/CartContext', () => ({
  useCart: () => ({ items: [], count: 0, subtotal: 0 }),
}));

describe('Footer', () => {
  beforeEach(() => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
  });

  it('renders the brand name', () => {
    expect(screen.getByText('PharmaCare')).toBeInTheDocument();
  });

  it('has clickable shop links', () => {
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('links to shop categories', () => {
    const prescriptionLink = screen.getByText('Prescription Medicines');
    expect(prescriptionLink.closest('a')).toHaveAttribute('href', '/shop?category=cat_antibiotics');
  });

  it('displays copyright', () => {
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });
});
