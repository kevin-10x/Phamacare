import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import MedicineCard from '../components/MedicineCard';

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const category = params.get('category') || '';
  const search = params.get('search') || '';

  useEffect(() => {
    api.get('/api/categories').then((d) => setCategories(d.categories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (category) qs.set('category', category);
    if (search) qs.set('search', search);
    api
      .get(`/api/medicines?${qs.toString()}`)
      .then((d) => setMedicines(d.medicines || []))
      .catch(() => setMedicines([]))
      .finally(() => setLoading(false));
  }, [category, search]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-4 gap-8">
      <aside className="md:col-span-1">
        <h2 className="font-display text-lg font-semibold mb-4">Categories</h2>
        <ul className="space-y-1 text-sm">
          <li>
            <button
              onClick={() => setParams({})}
              className={`w-full text-left px-3 py-2 rounded-lg ${!category ? 'bg-mist font-medium' : 'hover:bg-mist/60'}`}
            >
              All medicines
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setParams({ category: c.id })}
                className={`w-full text-left px-3 py-2 rounded-lg ${category === c.id ? 'bg-mist font-medium' : 'hover:bg-mist/60'}`}
              >
                {c.icon} {c.name}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="md:col-span-3">
        <h1 className="font-display text-2xl font-semibold mb-6">
          {search ? `Results for "${search}"` : 'All medicines'}
        </h1>
        {loading ? (
          <p className="text-ink/50">Loading medicines…</p>
        ) : medicines.length === 0 ? (
          <p className="text-ink/50">No medicines found. Try a different search or category.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
            {medicines.map((m) => (
              <MedicineCard key={m.id} medicine={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
