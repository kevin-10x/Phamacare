import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useCart } from '../context/CartContext';

export default function Checkout() {
  const { items, subtotal, refresh } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [prescriptionId, setPrescriptionId] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const needsRx = items.some((i) => i.requires_prescription);

  useEffect(() => {
    if (needsRx) {
      api.get('/api/prescriptions/mine').then((d) =>
        setPrescriptions((d.prescriptions || []).filter((p: any) => p.status === 'approved'))
      );
    }
  }, [needsRx]);

  async function placeOrder() {
    setError('');
    if (needsRx && !prescriptionId) {
      setError('Please select an approved prescription — this order contains prescription medicine.');
      return;
    }
    setPlacing(true);
    try {
      const data = await api.post('/api/orders', {
        paymentMethod,
        deliveryAddress: address,
        prescriptionId: prescriptionId || undefined,
      });
      await refresh();
      navigate(`/dashboard?order=${data.orderId}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPlacing(false);
    }
  }

  const total = subtotal + (subtotal > 3000 ? 0 : 200);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-semibold mb-8">Checkout</h1>

      <div className="card p-6 mb-6">
        <h2 className="font-medium mb-4">Delivery address</h2>
        <textarea
          className="input"
          rows={3}
          placeholder="Estate, street, house/apartment number, town"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      {needsRx && (
        <div className="card p-6 mb-6">
          <h2 className="font-medium mb-4">Select an approved prescription</h2>
          {prescriptions.length === 0 ? (
            <p className="text-sm text-sienna">
              No approved prescriptions found. <a href="/prescriptions" className="underline">Upload one</a> and
              wait for pharmacist approval before checking out.
            </p>
          ) : (
            <select className="input" value={prescriptionId} onChange={(e) => setPrescriptionId(e.target.value)}>
              <option value="">Select prescription…</option>
              {prescriptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.file_name} — approved
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div className="card p-6 mb-6">
        <h2 className="font-medium mb-4">Payment method</h2>
        <div className="space-y-2">
          {[
            ['mpesa', 'M-Pesa (STK push to your phone)'],
            ['card', 'Debit / Credit card'],
            ['cod', 'Cash on delivery'],
          ].map(([value, label]) => (
            <label key={value} className="flex items-center gap-3 p-3 border border-mist rounded-lg cursor-pointer">
              <input
                type="radio"
                name="payment"
                value={value}
                checked={paymentMethod === value}
                onChange={() => setPaymentMethod(value)}
              />
              {label}
            </label>
          ))}
          {paymentMethod === 'mpesa' && (
            <input
              className="input mt-2"
              placeholder="M-Pesa phone number (07XX XXX XXX)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          )}
        </div>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex justify-between font-semibold text-lg">
          <span>Total to pay</span>
          <span>KSh {total.toFixed(0)}</span>
        </div>
      </div>

      {error && <p className="text-sienna mb-4">{error}</p>}

      <button onClick={placeOrder} disabled={placing || !address} className="btn-primary w-full disabled:opacity-50">
        {placing ? 'Placing order…' : 'Place order'}
      </button>
    </div>
  );
}
