import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

export default function MedicineCard({ medicine }: { medicine: any }) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const { toggle, isInWishlist } = useWishlist();
  const navigate = useNavigate();
  const finalPrice = medicine.price * (1 - (medicine.discount_percent || 0) / 100);
  const liked = isInWishlist(medicine.id);

  async function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (!user) return navigate('/login');
    await addItem(medicine.id, 1);
  }

  async function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate('/login');
    await toggle(medicine.id);
  }

  return (
    <Link to={`/product/${medicine.id}`} className="card p-4 flex flex-col group relative">
      <button
        onClick={handleWishlist}
        className="absolute top-3 right-3 z-10 text-xl transition-colors"
        aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        {liked ? '❤️' : '🤍'}
      </button>
      <div className="aspect-square bg-mist rounded-xl mb-3 flex items-center justify-center text-4xl overflow-hidden">
        {medicine.image_url ? (
          <img src={medicine.image_url} alt={medicine.brand_name} className="w-full h-full object-cover" />
        ) : (
          '💊'
        )}
      </div>
      {medicine.requires_prescription ? (
        <span className="text-xs font-medium text-sienna mb-1">Prescription required</span>
      ) : (
        <span className="text-xs font-medium text-clove2 mb-1">OTC</span>
      )}
      <h3 className="font-display font-medium text-ink leading-tight group-hover:text-clove">
        {medicine.brand_name}
      </h3>
      {medicine.generic_name && <p className="text-xs text-ink/50">{medicine.generic_name}</p>}
      <div className="mt-2 flex items-center gap-2">
        <span className="font-semibold">KSh {finalPrice.toFixed(0)}</span>
        {medicine.discount_percent > 0 && (
          <span className="text-xs text-ink/40 line-through">KSh {medicine.price.toFixed(0)}</span>
        )}
      </div>
      {medicine.rating > 0 && (
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs text-amber-500">{'★'.repeat(Math.round(medicine.rating))}</span>
          <span className="text-xs text-ink/40">{medicine.rating.toFixed(1)}</span>
        </div>
      )}
      <button onClick={handleAdd} className="btn-primary mt-3 !py-2 text-sm">
        Add to cart
      </button>
    </Link>
  );
}
