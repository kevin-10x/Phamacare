import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-clove text-parchment/80 mt-20">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <div className="font-display text-xl text-white mb-3">PharmaCare</div>
          <p>Licensed online pharmacy delivering across Kenya. Reg. No. PPB/XXXX.</p>
        </div>
        <div>
          <div className="font-medium text-white mb-3">Shop</div>
          <ul className="space-y-2">
            <li><Link to="/shop?category=cat_pain_killers" className="hover:text-white transition-colors">Pain Killers</Link></li>
            <li><Link to="/shop?category=cat_antibiotics" className="hover:text-white transition-colors">Antibiotics</Link></li>
            <li><Link to="/shop?category=cat_vitamins" className="hover:text-white transition-colors">Vitamins &amp; Supplements</Link></li>
            <li><Link to="/shop?category=cat_children" className="hover:text-white transition-colors">Children's Medicine</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-medium text-white mb-3">Support</div>
          <ul className="space-y-2">
            <li><Link to="/interactions" className="hover:text-white transition-colors">Drug Interaction Check</Link></li>
            <li><Link to="/blog" className="hover:text-white transition-colors">Health Blog</Link></li>
            <li><Link to="/prescriptions" className="hover:text-white transition-colors">Upload Prescription</Link></li>
            <li><Link to="/dashboard" className="hover:text-white transition-colors">Track My Order</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-medium text-white mb-3">Legal</div>
          <ul className="space-y-2">
            <li><Link to="/prescriptions" className="hover:text-white transition-colors">Prescription Policy</Link></li>
            <li><Link to="/" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link to="/" className="hover:text-white transition-colors">Terms of Service</Link></li>
            <li><Link to="/" className="hover:text-white transition-colors">Pharmacy Board License</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 text-center text-xs py-4">
        © {new Date().getFullYear()} PharmaCare. All rights reserved.
      </div>
    </footer>
  );
}
