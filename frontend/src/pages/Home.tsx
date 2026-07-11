import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import MedicineCard from '../components/MedicineCard';

export default function Home() {
  const [categories, setCategories] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);

  useEffect(() => {
    api.get('/api/categories').then((d) => setCategories(d.categories || [])).catch(() => {});
    api.get('/api/medicines?featured=true').then((d) => setFeatured(d.medicines || [])).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-clove text-parchment">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="uppercase tracking-widest text-sienna text-xs font-semibold mb-4">
              Licensed Kenyan Pharmacy
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-5">
              Your prescription, sorted — delivered to your door.
            </h1>
            <p className="text-parchment/80 mb-8 max-w-md">
              Upload a prescription, get it verified by a licensed pharmacist, and have your
              medicine at your door the same day. OTC essentials, always in stock.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/prescriptions" className="btn-primary bg-sienna hover:bg-sienna/90">
                Upload a prescription
              </Link>
              <Link to="/shop" className="btn-secondary !border-parchment !text-parchment hover:!bg-white/10">
                Browse medicines
              </Link>
            </div>
          </div>
          <div className="hidden md:flex justify-center">
            <div className="w-72 h-72 rounded-full bg-white/10 flex items-center justify-center text-8xl">
              💊
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="font-display text-2xl font-semibold mb-6">Shop by category</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.id}`}
              className="card p-5 flex flex-col items-center text-center gap-2"
            >
              <span className="text-3xl">{cat.icon}</span>
              <span className="text-sm font-medium">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-semibold">Featured products</h2>
          <Link to="/shop" className="text-clove font-medium text-sm hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {featured.map((m) => (
            <MedicineCard key={m.id} medicine={m} />
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="bg-mist">
        <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            ['🩺', 'Pharmacist-verified'],
            ['🚚', 'Same-day delivery'],
            ['📱', 'M-Pesa & card payments'],
            ['🔒', 'Secure & confidential'],
          ].map(([icon, label]) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <span className="text-2xl">{icon}</span>
              <span className="text-sm font-medium text-ink/70">{label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
