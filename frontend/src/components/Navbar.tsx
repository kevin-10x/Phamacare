import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(`/shop?search=${encodeURIComponent(query)}`);
    setMobileOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 bg-parchment/90 backdrop-blur border-b border-mist">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link to="/" className="font-display text-2xl font-semibold text-clove shrink-0">
          Pharma<span className="text-sienna">Care</span>
        </Link>

        <form onSubmit={onSearch} className="flex-1 hidden md:flex">
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="input" placeholder="Search medicines, e.g. Paracetamol" />
        </form>

        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-ink/80">
          <Link to="/shop" className="hover:text-clove">Shop</Link>
          <Link to="/interactions" className="hover:text-clove">Drug Check</Link>
          <Link to="/blog" className="hover:text-clove">Blog</Link>
          <Link to="/prescriptions" className="hover:text-clove">Upload Rx</Link>
          {user?.role === 'pharmacist' && <Link to="/pharmacist" className="hover:text-clove">Pharmacist</Link>}
          {user?.role === 'admin' && <Link to="/admin" className="hover:text-clove">Admin</Link>}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          {user && (
            <Link to="/wishlist" className="text-xl hidden md:block" title="Wishlist">🤍</Link>
          )}
          <Link to="/cart" className="relative">
            <span className="text-2xl">🛒</span>
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-sienna text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
        </div>

        {user ? (
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/dashboard" className="text-sm font-medium hover:text-clove hidden md:block">
              {user.fullName || user.full_name || 'Account'}
            </Link>
            <button onClick={logout} className="btn-secondary !px-4 !py-2 text-sm hidden md:block">Log out</button>
          </div>
        ) : (
          <Link to="/login" className="btn-primary !px-5 !py-2.5 text-sm shrink-0 hidden md:block">Sign in</Link>
        )}

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-2xl">☰</button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-mist bg-parchment px-4 py-4 space-y-3">
          <form onSubmit={onSearch}>
            <input value={query} onChange={(e) => setQuery(e.target.value)} className="input" placeholder="Search medicines" />
          </form>
          <Link to="/shop" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>Shop</Link>
          <Link to="/interactions" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>Drug Interaction Check</Link>
          <Link to="/blog" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>Health Blog</Link>
          <Link to="/prescriptions" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>Upload Rx</Link>
          {user && <Link to="/wishlist" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>Wishlist</Link>}
          {user && <Link to="/profile" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>Profile</Link>}
          {user?.role === 'admin' && <Link to="/admin" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>Admin</Link>}
          {user?.role === 'admin' && <Link to="/admin/inventory" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>Inventory</Link>}
          {user?.role === 'pharmacist' && <Link to="/pharmacist" className="block text-sm font-medium" onClick={() => setMobileOpen(false)}>Pharmacist</Link>}
          {user ? (
            <button onClick={() => { logout(); setMobileOpen(false); }} className="text-sm font-medium text-sienna">Log out</button>
          ) : (
            <Link to="/login" className="block text-sm font-medium text-clove" onClick={() => setMobileOpen(false)}>Sign in</Link>
          )}
        </div>
      )}
    </header>
  );
}
