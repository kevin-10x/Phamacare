import { useWishlist } from '../context/WishlistContext';
import MedicineCard from '../components/MedicineCard';

export default function WishlistPage() {
  const { items } = useWishlist();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-semibold mb-2">My Wishlist</h1>
      <p className="text-ink/60 mb-8">Medicines you've saved for later.</p>
      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🤍</p>
          <p className="text-ink/50 mb-4">Your wishlist is empty.</p>
          <a href="/shop" className="btn-primary">Browse medicines</a>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {items.map((m) => <MedicineCard key={m.id} medicine={m} />)}
        </div>
      )}
    </div>
  );
}
