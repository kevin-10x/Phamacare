import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';

const allStatuses = ['pending', 'paid', 'processing', 'out_for_delivery', 'delivered'];

const statusLabels: Record<string, string> = {
  pending: 'Order Placed',
  paid: 'Payment Confirmed',
  processing: 'Being Prepared',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    api.get(`/api/orders/${id}`).then((d) => {
      setOrder(d.order);
      setItems(d.items || []);
    }).catch(() => {});
  }, [id]);

  if (!order) return <div className="max-w-3xl mx-auto px-4 py-16">Loading…</div>;

  const currentIdx = allStatuses.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-semibold mb-2">Order #{order.id.slice(-8).toUpperCase()}</h1>
      <p className="text-ink/60 mb-8">Placed on {new Date(order.created_at).toLocaleString()}</p>

      {/* Status Timeline */}
      <div className="card p-6 mb-6">
        <h2 className="font-medium mb-6">Order Status</h2>
        {isCancelled ? (
          <div className="text-center py-4">
            <span className="text-4xl">❌</span>
            <p className="text-red-600 font-medium mt-2">Order Cancelled</p>
          </div>
        ) : (
          <div className="space-y-0">
            {allStatuses.map((status, idx) => {
              const isComplete = idx <= currentIdx;
              const isCurrent = idx === currentIdx;
              return (
                <div key={status} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isComplete ? 'bg-clove border-clove' : 'border-mist bg-white'
                    }`}>
                      {isComplete && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    {idx < allStatuses.length - 1 && (
                      <div className={`w-0.5 h-8 ${isComplete ? 'bg-clove' : 'bg-mist'}`} />
                    )}
                  </div>
                  <div className={`pb-6 ${isCurrent ? 'font-semibold text-clove' : isComplete ? 'text-ink/70' : 'text-ink/30'}`}>
                    <p>{statusLabels[status]}</p>
                    {isCurrent && <p className="text-xs text-clove mt-0.5">Current status</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className="card p-6 mb-6">
        <h2 className="font-medium mb-4">Items</h2>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{item.brand_name}</p>
                <p className="text-xs text-ink/50">Qty: {item.quantity} × KSh {item.unit_price.toFixed(0)}</p>
              </div>
              <p className="font-medium">KSh {(item.quantity * item.unit_price).toFixed(0)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="card p-6">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>KSh {order.subtotal.toFixed(0)}</span></div>
          <div className="flex justify-between"><span>Delivery</span><span>{order.delivery_fee === 0 ? 'Free' : `KSh ${order.delivery_fee.toFixed(0)}`}</span></div>
          <div className="flex justify-between font-semibold text-lg border-t border-mist pt-2"><span>Total</span><span>KSh {order.total.toFixed(0)}</span></div>
        </div>
        {order.delivery_address && (
          <div className="mt-4 text-sm text-ink/60">
            <p className="font-medium text-ink/80">Delivery address:</p>
            <p>{order.delivery_address}</p>
          </div>
        )}
      </div>
    </div>
  );
}
