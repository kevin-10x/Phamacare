import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import MedicineCard from '../components/MedicineCard';

export default function ProductDetail() {
  const { id } = useParams();
  const [medicine, setMedicine] = useState<any>(null);
  const [similar, setSimilar] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState({ count: 0, avg: 0 });
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');
  const { addItem } = useCart();
  const { user } = useAuth();
  const { toggle, isInWishlist } = useWishlist();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/api/medicines/${id}`).then((d) => {
      setMedicine(d.medicine);
      setSimilar(d.similar || []);
    }).catch(() => {});
    api.get(`/api/reviews/${id}`).then((d) => {
      setReviews(d.reviews || []);
      setReviewStats(d.stats || { count: 0, avg: 0 });
    }).catch(() => {});
  }, [id]);

  if (!medicine) return <div className="max-w-6xl mx-auto px-4 py-16">Loading…</div>;

  const finalPrice = medicine.price * (1 - (medicine.discount_percent || 0) / 100);
  const liked = isInWishlist(medicine.id);

  async function handleAdd() {
    if (!user) return navigate('/login');
    await addItem(medicine.id, qty);
  }

  async function handleWishlist() {
    if (!user) return navigate('/login');
    await toggle(medicine.id);
  }

  async function submitReview() {
    if (!user) return navigate('/login');
    setReviewMsg('');
    try {
      await api.post('/api/reviews', { medicineId: medicine.id, rating, comment: comment || undefined });
      setReviewMsg('Review submitted!');
      setComment('');
      setRating(5);
      const d = await api.get(`/api/reviews/${id}`);
      setReviews(d.reviews || []);
      setReviewStats(d.stats || { count: 0, avg: 0 });
    } catch (e: any) {
      setReviewMsg(e.message || 'Failed to submit review');
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid md:grid-cols-2 gap-10">
        <div className="aspect-square bg-mist rounded-2xl flex items-center justify-center text-8xl">
          {medicine.image_url ? (
            <img src={medicine.image_url} alt={medicine.brand_name} className="w-full h-full object-cover rounded-2xl" />
          ) : '💊'}
        </div>
        <div>
          {medicine.requires_prescription ? (
            <span className="inline-block text-xs font-medium text-sienna bg-sienna/10 px-3 py-1 rounded-full mb-3">Prescription required</span>
          ) : (
            <span className="inline-block text-xs font-medium text-clove2 bg-clove2/10 px-3 py-1 rounded-full mb-3">Over-the-counter</span>
          )}
          <h1 className="font-display text-3xl font-semibold">{medicine.brand_name}</h1>
          {medicine.generic_name && <p className="text-ink/50 mb-2">{medicine.generic_name} · {medicine.strength}</p>}
          <p className="text-sm text-ink/60 mb-4">{medicine.manufacturer} · {medicine.dosage_form}</p>

          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-2xl font-semibold">KSh {finalPrice.toFixed(0)}</span>
            {medicine.discount_percent > 0 && (
              <span className="text-ink/40 line-through">KSh {medicine.price.toFixed(0)}</span>
            )}
          </div>

          {reviewStats.count > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-amber-500">{'★'.repeat(Math.round(reviewStats.avg))}</span>
              <span className="text-sm text-ink/60">{reviewStats.avg.toFixed(1)} ({reviewStats.count} reviews)</span>
            </div>
          )}

          <p className="mb-6 text-ink/80">{medicine.description}</p>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center border border-mist rounded-full">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-2">−</button>
              <span className="px-2">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-4 py-2">+</button>
            </div>
            <button onClick={handleAdd} className="btn-primary flex-1">Add to cart</button>
            <button onClick={handleWishlist} className="btn-secondary !px-4">
              {liked ? '❤️' : '🤍'}
            </button>
          </div>

          {medicine.requires_prescription === 1 && (
            <p className="text-sm text-sienna bg-sienna/5 border border-sienna/20 rounded-lg p-3">
              This medicine requires a valid prescription. You can upload one from your cart at checkout.
            </p>
          )}

          <div className="mt-6 space-y-0">
            {[
              ['Uses', medicine.uses],
              ['Dosage instructions', medicine.dosage_instructions],
              ['Side effects', medicine.side_effects],
              ['Warnings', medicine.warnings],
              ['Storage conditions', medicine.storage_conditions],
            ].filter(([, v]) => v).map(([label, value]) => (
              <details key={label} className="border-t border-mist pt-4 mt-4">
                <summary className="cursor-pointer font-medium">{label}</summary>
                <p className="text-sm text-ink/70 mt-2">{value}</p>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16">
        <h2 className="font-display text-2xl font-semibold mb-6">Customer Reviews</h2>
        <div className="card p-6 mb-6">
          <h3 className="font-medium mb-3">Write a review</h3>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-ink/60">Rating:</span>
            {[1, 2, 3, 4, 5].map((s) => (
              <button key={s} onClick={() => setRating(s)} className={`text-2xl ${s <= rating ? 'text-amber-400' : 'text-ink/20'}`}>
                ★
              </button>
            ))}
          </div>
          <textarea
            className="input mb-3"
            rows={3}
            placeholder="Share your experience with this medicine (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button onClick={submitReview} className="btn-primary !py-2 text-sm">Submit Review</button>
          {reviewMsg && <p className="text-sm mt-2 text-clove2">{reviewMsg}</p>}
        </div>
        <div className="space-y-4">
          {reviews.length === 0 && <p className="text-ink/50">No reviews yet. Be the first!</p>}
          {reviews.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-500">{'★'.repeat(r.rating)}</span>
                <span className="text-sm font-medium">{r.reviewer_name}</span>
                <span className="text-xs text-ink/40">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              {r.comment && <p className="text-sm text-ink/70">{r.comment}</p>}
            </div>
          ))}
        </div>
      </div>

      {similar.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display text-2xl font-semibold mb-6">Similar medicines</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {similar.map((m) => <MedicineCard key={m.id} medicine={m} />)}
          </div>
        </div>
      )}
    </div>
  );
}
