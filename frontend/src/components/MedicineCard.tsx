import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function MedicineCard({ medicine }: { medicine: any }) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const finalPrice = medicine.price * (1 - (medicine.discount_percent || 0) / 100);

  async function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (!user) return navigate('/login');
    await addItem(medicine.id, 1);
  }

  return (
    <Link to={`/product/${medicine.id}`} className="card p-4 flex flex-col group">
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
      <button onClick={handleAdd} className="btn-primary mt-3 !py-2 text-sm">
        Add to cart
      </button>
    </Link>
  );
}
