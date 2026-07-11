import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(`/shop?search=${encodeURIComponent(query)}`);
  }

  return (
    <header className="sticky top-0 z-40 bg-parchment/90 backdrop-blur border-b border-mist">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
        <Link to="/" className="font-display text-2xl font-semibold text-clove shrink-0">
          Pharma<span className="text-sienna">Care</span>
        </Link>

        <form onSubmit={onSearch} className="flex-1 hidden md:flex">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input"
            placeholder="Search medicines, e.g. Paracetamol"
          />
        </form>

        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-ink/80">
          <Link to="/shop" className="hover:text-clove">Shop</Link>
          <Link to="/prescriptions" className="hover:text-clove">Upload Rx</Link>
          {user?.role === 'pharmacist' && <Link to="/pharmacist" className="hover:text-clove">Pharmacist</Link>}
          {user?.role === 'admin' && <Link to="/admin" className="hover:text-clove">Admin</Link>}
        </nav>

        <Link to="/cart" className="relative shrink-0">
          <span className="text-2xl">🛒</span>
          {count > 0 && (
            <span className="absolute -top-2 -right-2 bg-sienna text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {count}
            </span>
          )}
        </Link>

        {user ? (
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/dashboard" className="text-sm font-medium hover:text-clove">
              {user.fullName || user.full_name || 'Account'}
            </Link>
            <button onClick={logout} className="btn-secondary !px-4 !py-2 text-sm">Log out</button>
          </div>
        ) : (
          <Link to="/login" className="btn-primary !px-5 !py-2.5 text-sm shrink-0">Sign in</Link>
        )}
      </div>
    </header>
  );
}
