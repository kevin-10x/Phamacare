import { useEffect, useState } from 'react';
import { api } from '../api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    api.get('/api/admin/stats').then(setStats).catch(() => {});
    api.get('/api/admin/orders').then((d) => setOrders(d.orders || [])).catch(() => {});
  }, []);

  async function updateStatus(id: string, status: string) {
    await api.put(`/api/admin/orders/${id}/status`, { status });
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-semibold mb-8">Admin dashboard</h1>

      <div className="grid md:grid-cols-4 gap-4 mb-10">
        <div className="card p-5">
          <p className="text-xs text-ink/50 mb-1">Total revenue</p>
          <p className="text-2xl font-semibold">KSh {(stats?.totalRevenue || 0).toFixed(0)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink/50 mb-1">Total orders</p>
          <p className="text-2xl font-semibold">{stats?.totalOrders || 0}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink/50 mb-1">Customers</p>
          <p className="text-2xl font-semibold">{stats?.totalCustomers || 0}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ink/50 mb-1">Pending prescriptions</p>
          <p className="text-2xl font-semibold">{stats?.pendingPrescriptions || 0}</p>
        </div>
      </div>

      {stats?.lowStock?.length > 0 && (
        <div className="card p-5 mb-10">
          <h2 className="font-medium mb-3">Low stock alerts</h2>
          <ul className="text-sm space-y-1">
            {stats.lowStock.map((m: any) => (
              <li key={m.id} className="flex justify-between">
                <span>{m.brand_name}</span>
                <span className="text-sienna font-medium">{m.stock_quantity} left</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2 className="font-display text-xl font-semibold mb-4">All orders</h2>
      <div className="space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="card p-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">#{o.id.slice(-8).toUpperCase()}</p>
              <p className="text-xs text-ink/50">{new Date(o.created_at).toLocaleString()}</p>
            </div>
            <p className="font-semibold">KSh {o.total.toFixed(0)}</p>
            <select
              value={o.status}
              onChange={(e) => updateStatus(o.id, e.target.value)}
              className="input !w-auto"
            >
              {['pending', 'paid', 'processing', 'out_for_delivery', 'delivered', 'cancelled'].map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
