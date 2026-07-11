import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const statusColor: Record<string, string> = {
  pending: 'text-amber-600 bg-amber-50',
  paid: 'text-clove2 bg-clove2/10',
  processing: 'text-blue-600 bg-blue-50',
  out_for_delivery: 'text-blue-600 bg-blue-50',
  delivered: 'text-clove2 bg-clove2/10',
  cancelled: 'text-red-600 bg-red-50',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    api.get('/api/orders/mine').then((d) => setOrders(d.orders || [])).catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-semibold mb-2">Hi, {user?.fullName || user?.full_name}</h1>
      <p className="text-ink/60 mb-8">Welcome to your PharmaCare dashboard.</p>

      <div className="grid md:grid-cols-4 gap-4 mb-10">
        <div className="card p-5">
          <p className="text-xs text-ink/50 mb-1">Loyalty points</p>
          <p className="text-2xl font-semibold">{(user as any)?.loyaltyPoints || 0}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink/50 mb-1">Total orders</p>
          <p className="text-2xl font-semibold">{orders.length}</p>
        </div>
        <Link to="/profile" className="card p-5 hover:shadow-md transition-shadow">
          <p className="text-xs text-ink/50 mb-1">My Profile</p>
          <p className="text-2xl font-semibold">👤</p>
        </Link>
        <Link to="/wishlist" className="card p-5 hover:shadow-md transition-shadow">
          <p className="text-xs text-ink/50 mb-1">Wishlist</p>
          <p className="text-2xl font-semibold">❤️</p>
        </Link>
      </div>

      <h2 className="font-display text-xl font-semibold mb-4">Your orders</h2>
      <div className="space-y-3">
        {orders.length === 0 && <p className="text-ink/50">No orders yet.</p>}
        {orders.map((o) => (
          <Link key={o.id} to={`/order/${o.id}`} className="card p-4 flex items-center justify-between hover:shadow-md transition-shadow block">
            <div>
              <p className="font-medium">Order #{o.id.slice(-8).toUpperCase()}</p>
              <p className="text-xs text-ink/50">{new Date(o.created_at).toLocaleString()}</p>
            </div>
            <p className="font-semibold">KSh {o.total.toFixed(0)}</p>
            <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColor[o.status] || ''}`}>
              {o.status.replace(/_/g, ' ')}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
