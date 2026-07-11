import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import MedicineCard from '../components/MedicineCard';

export default function ProductDetail() {
  const { id } = useParams();
  const [medicine, setMedicine] = useState<any>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/api/medicines/${id}`).then((d) => {
      setMedicine(d.medicine);
      setSimilar(d.similar || []);
    });
  }, [id]);

  if (!medicine) return <div className="max-w-6xl mx-auto px-4 py-16">Loading…</div>;

  const finalPrice = medicine.price * (1 - (medicine.discount_percent || 0) / 100);

  async function handleAdd() {
    if (!user) return navigate('/login');
    await addItem(medicine.id, qty);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid md:grid-cols-2 gap-10">
        <div className="aspect-square bg-mist rounded-2xl flex items-center justify-center text-8xl">
          {medicine.image_url ? (
            <img src={medicine.image_url} alt={medicine.brand_name} className="w-full h-full object-cover rounded-2xl" />
          ) : (
            '💊'
          )}
        </div>
        <div>
          {medicine.requires_prescription ? (
            <span className="inline-block text-xs font-medium text-sienna bg-sienna/10 px-3 py-1 rounded-full mb-3">
              Prescription required
            </span>
          ) : (
            <span className="inline-block text-xs font-medium text-clove2 bg-clove2/10 px-3 py-1 rounded-full mb-3">
              Over-the-counter
            </span>
          )}
          <h1 className="font-display text-3xl font-semibold">{medicine.brand_name}</h1>
          {medicine.generic_name && <p className="text-ink/50 mb-2">{medicine.generic_name} · {medicine.strength}</p>}
          <p className="text-sm text-ink/60 mb-4">{medicine.manufacturer}</p>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-2xl font-semibold">KSh {finalPrice.toFixed(0)}</span>
            {medicine.discount_percent > 0 && (
              <span className="text-ink/40 line-through">KSh {medicine.price.toFixed(0)}</span>
            )}
          </div>

          <p className="mb-6 text-ink/80">{medicine.description}</p>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center border border-mist rounded-full">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-2">−</button>
              <span className="px-2">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-4 py-2">+</button>
            </div>
            <button onClick={handleAdd} className="btn-primary flex-1">
              Add to cart
            </button>
          </div>

          {medicine.requires_prescription === 1 && (
            <p className="text-sm text-sienna bg-sienna/5 border border-sienna/20 rounded-lg p-3">
              This medicine requires a valid prescription. You can upload one from your cart at checkout.
            </p>
          )}

          <details className="mt-6 border-t border-mist pt-4">
            <summary className="cursor-pointer font-medium">Uses</summary>
            <p className="text-sm text-ink/70 mt-2">{medicine.uses}</p>
          </details>
          <details className="border-t border-mist pt-4 mt-4">
            <summary className="cursor-pointer font-medium">Dosage instructions</summary>
            <p className="text-sm text-ink/70 mt-2">{medicine.dosage_instructions}</p>
          </details>
          <details className="border-t border-mist pt-4 mt-4">
            <summary className="cursor-pointer font-medium">Side effects &amp; warnings</summary>
            <p className="text-sm text-ink/70 mt-2">{medicine.side_effects} {medicine.warnings}</p>
          </details>
          <details className="border-t border-mist pt-4 mt-4 border-b pb-4">
            <summary className="cursor-pointer font-medium">Storage conditions</summary>
            <p className="text-sm text-ink/70 mt-2">{medicine.storage_conditions}</p>
          </details>
        </div>
      </div>

      {similar.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display text-2xl font-semibold mb-6">Similar medicines</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {similar.map((m) => (
              <MedicineCard key={m.id} medicine={m} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
