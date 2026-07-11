import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Cart() {
  const { items, subtotal, removeItem, addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const needsRx = items.some((i) => i.requires_prescription);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-semibold mb-8">Your cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-ink/50 mb-4">Your cart is empty.</p>
          <Link to="/shop" className="btn-primary">Browse medicines</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.cart_item_id} className="card p-4 flex items-center gap-4">
                <div className="w-16 h-16 bg-mist rounded-xl flex items-center justify-center text-2xl">💊</div>
                <div className="flex-1">
                  <p className="font-medium">{item.brand_name}</p>
                  {item.requires_prescription === 1 && (
                    <p className="text-xs text-sienna">Prescription required</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-xs text-ink/40 hover:text-sienna"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div className="flex items-center border border-mist rounded-full">
                  <button onClick={() => addItem(item.id, -1)} className="px-3 py-1">−</button>
                  <span className="px-2">{item.quantity}</span>
                  <button onClick={() => addItem(item.id, 1)} className="px-3 py-1">+</button>
                </div>
                <p className="w-24 text-right font-semibold">
                  KSh {(item.quantity * item.price * (1 - item.discount_percent / 100)).toFixed(0)}
                </p>
              </div>
            ))}
          </div>

          <div className="card p-6 h-fit">
            <h2 className="font-display text-lg font-semibold mb-4">Order summary</h2>
            <div className="flex justify-between text-sm mb-2">
              <span>Subtotal</span>
              <span>KSh {subtotal.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-sm mb-4 text-ink/60">
              <span>Delivery</span>
              <span>{subtotal > 3000 ? 'Free' : 'KSh 200'}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t border-mist pt-4 mb-4">
              <span>Total</span>
              <span>KSh {(subtotal + (subtotal > 3000 ? 0 : 200)).toFixed(0)}</span>
            </div>
            {needsRx && (
              <p className="text-xs text-sienna bg-sienna/5 border border-sienna/20 rounded-lg p-3 mb-4">
                One or more items need a verified prescription. You'll upload it at checkout.
              </p>
            )}
            <button
              onClick={() => (user ? navigate('/checkout') : navigate('/login'))}
              className="btn-primary w-full"
            >
              Proceed to checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
